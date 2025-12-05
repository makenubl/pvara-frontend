# PVARA Backend Implementation Guide

## Quick Start: Local Development Setup

### Prerequisites
```bash
# Install Docker Desktop (includes Docker Compose)
# Install Go 1.21+
# Install Node.js 18+
# Install kubectl (for Kubernetes)
# Install Helm (Kubernetes package manager)
```

### Step 1: Clone and Setup

```bash
# Clone repository
git clone https://github.com/makenubl/pvara-backend.git
cd pvara-backend

# Create environment files
cp .env.example .env
# Edit .env with your settings
```

### Step 2: Start Infrastructure (Docker Compose)

```bash
# Start all services: PostgreSQL, Redis, Kafka, Elasticsearch, Kong, Prometheus, Grafana
docker-compose up -d

# Verify all services are running
docker-compose ps

# Check logs
docker-compose logs -f

# Access services:
# PostgreSQL: localhost:5432
# Redis: localhost:6379
# Kafka UI: localhost:8080
# Prometheus: localhost:9090
# Grafana: localhost:3001 (admin:admin123)
# Kong Admin: localhost:8001
# MinIO: localhost:9001 (minioadmin:minioadmin123)
```

### Step 3: Initialize Database

```bash
# Connect to PostgreSQL
psql -h localhost -U pvara -d pvara_recruitment

# Run migrations (or use Flyway/Liquibase)
\i infrastructure/database/schema.sql

# Verify tables
\dt

# Exit
\q
```

### Step 4: Configure Kong API Gateway

```bash
# Add services to Kong
curl -X POST http://localhost:8001/services \
  -d "name=auth-service&url=http://auth-service:8001"

# Add route
curl -X POST http://localhost:8001/services/auth-service/routes \
  -d "paths[]=/auth"

# Enable rate limiting plugin
curl -X POST http://localhost:8001/plugins \
  -d "name=rate-limiting&service.name=auth-service&config.minute=1000"
```

### Step 5: Build and Run Services

#### Auth Service (Go)
```bash
cd services/auth-service
go mod download
go mod tidy

# Build
go build -o auth-service ./cmd

# Run
./auth-service
# or with environment variables
DATABASE_URL="..." JWT_SECRET="..." PORT=8001 ./auth-service

# Test
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pvara.io","password":"password123"}'
```

#### Jobs Service (Go)
```bash
cd services/jobs-service
go build -o jobs-service ./cmd
./jobs-service
```

#### Notifications Service (Node.js)
```bash
cd services/notifications-service
npm install
npm start
```

---

## 🔐 Security Configuration

### Generate JWT Secret
```bash
# Generate secure random string
openssl rand -base64 32
# Output: mJ+Fs7zXkL4pQ2nRvWyH/jM8dE3gH5jK1=

# Store in Kubernetes secret
kubectl create secret generic jwt-secret \
  --from-literal=secret=mJ+Fs7zXkL4pQ2nRvWyH/jM8dE3gH5jK1= \
  -n pvara
```

### Enable TLS
```bash
# Using Certbot with Let's Encrypt
certbot certonly --standalone -d api.pvara.io

# Or use cert-manager in Kubernetes
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@pvara.io
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### Database Encryption
```sql
-- Enable pgcrypto extension
CREATE EXTENSION pgcrypto;

-- Encrypt sensitive columns
ALTER TABLE applications 
ADD COLUMN candidate_cnic_encrypted bytea;

-- Create function to encrypt/decrypt
CREATE OR REPLACE FUNCTION encrypt_data(data TEXT)
RETURNS bytea AS $$
BEGIN
  RETURN pgp_sym_encrypt(data, 'encryption_key_here');
END;
$$ LANGUAGE plpgsql;

-- Encrypt existing data
UPDATE applications 
SET candidate_cnic_encrypted = encrypt_data(candidate_cnic);
```

---

## 📊 Monitoring & Observability

### Prometheus Metrics

```yaml
# infrastructure/monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'auth-service'
    static_configs:
      - targets: ['localhost:8001']

  - job_name: 'jobs-service'
    static_configs:
      - targets: ['localhost:8002']

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:6379']
```

### Add Prometheus Metrics to Services

```go
// In auth-service
import "github.com/prometheus/client_golang/prometheus"

var (
  loginAttempts = prometheus.NewCounterVec(
    prometheus.CounterOpts{
      Name: "login_attempts_total",
      Help: "Total number of login attempts",
    },
    []string{"status"},
  )

  requestDuration = prometheus.NewHistogramVec(
    prometheus.HistogramOpts{
      Name: "request_duration_seconds",
      Help: "Request duration in seconds",
    },
    []string{"method", "endpoint"},
  )
)

func init() {
  prometheus.MustRegister(loginAttempts, requestDuration)
}

// Track metrics in handlers
func login(c *gin.Context) {
  start := time.Now()
  
  // ... login logic
  
  requestDuration.WithLabelValues("POST", "/auth/login").Observe(time.Since(start).Seconds())
  loginAttempts.WithLabelValues("success").Inc()
}
```

### Create Grafana Dashboards

```bash
# Access Grafana: http://localhost:3001
# Add Prometheus datasource: http://prometheus:9090
# Import dashboard: https://grafana.com/grafana/dashboards/
# Or create custom dashboards:

# Recommended panels:
# - Request rate (requests/sec)
# - P99 latency (milliseconds)
# - Error rate (%)
# - Database connections
# - Redis memory usage
# - Kafka lag
```

---

## 🧪 Load Testing

### Using k6 (Benchmark Tool)

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 1000,        // 1000 virtual users
  duration: '5m',   // 5 minute test
  rampUp: '1m',
  rampDown: '1m',
};

export default function() {
  // Test login endpoint
  let response = http.post('http://localhost:8001/auth/login', {
    email: 'user@pvara.io',
    password: 'password123',
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

```bash
# Run load test
k6 run load-test.js

# Or scale to 100K concurrent users
k6 run -e USERS=100000 load-test.js
```

---

## 🚀 Kubernetes Deployment

### Prerequisites
```bash
# Create Kubernetes cluster (AWS EKS, GCP GKE, or Azure AKS)
# Configure kubectl to access cluster
kubectl cluster-info
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace pvara

# Create secrets
kubectl create secret generic database-credentials \
  -n pvara \
  --from-literal=url="postgres://user:pass@postgres:5432/pvara_recruitment"

kubectl create secret generic jwt-secret \
  -n pvara \
  --from-literal=secret="your-secret-key"

# Apply manifests
kubectl apply -f kubernetes-deployment.yaml

# Verify deployment
kubectl get pods -n pvara
kubectl get services -n pvara
kubectl get ingress -n pvara

# Check logs
kubectl logs -f deployment/auth-service -n pvara

# Port forward for testing
kubectl port-forward -n pvara svc/auth-service 8001:8001
```

### Scale Services

```bash
# Manual scaling
kubectl scale deployment auth-service --replicas=10 -n pvara

# Auto-scaling (already configured in YAML)
kubectl get hpa -n pvara
kubectl describe hpa auth-service-hpa -n pvara
```

---

## 📦 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy Backend

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      
      - name: Run tests
        run: go test ./... -cover
      
      - name: Run security scan
        run: |
          go install github.com/securego/gosec/v2/cmd/gosec@latest
          gosec ./...
  
  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t pvara/auth-service:${{ github.sha }} services/auth-service
          docker build -t pvara/jobs-service:${{ github.sha }} services/jobs-service
      
      - name: Push to ECR
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}
          docker push ${{ secrets.ECR_REGISTRY }}/auth-service:${{ github.sha }}
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure kubectl
        run: |
          aws eks update-kubeconfig --name pvara-cluster --region us-east-1
      
      - name: Deploy to EKS
        run: |
          kubectl set image deployment/auth-service \
            auth-service=${{ secrets.ECR_REGISTRY }}/auth-service:${{ github.sha }} \
            -n pvara
```

---

## 📚 API Documentation

### Generate OpenAPI/Swagger Docs

```go
// services/auth-service/main.go
import "github.com/swaggo/swag/cmd/swag"

// @title PVARA Auth Service API
// @version 1.0
// @description Authentication service for PVARA recruitment platform

// @login godoc
func (s *AuthService) Login(email, password string) (*LoginResponse, error) {
  // ...
}

// Generate docs
// swag init -g main.go
```

```bash
# Access Swagger UI
# http://localhost:8001/swagger/index.html
```

---

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
psql -h localhost -U pvara -d pvara_recruitment

# Check connection pool
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;
```

### Memory Leaks
```bash
# Profile memory usage
go tool pprof http://localhost:8001/debug/pprof/heap

# Check Go routines
curl http://localhost:8001/debug/pprof/goroutine?debug=1
```

### Kafka Issues
```bash
# Check topic status
kafka-topics --bootstrap-server localhost:9092 --list

# Monitor consumer lag
kafka-consumer-groups --bootstrap-server localhost:9092 --group auth-service --describe
```

---

## 📖 Additional Resources

- PostgreSQL Partitioning: https://www.postgresql.org/docs/current/ddl-partitioning.html
- Kafka Best Practices: https://kafka.apache.org/documentation/
- Kong API Gateway: https://docs.konghq.com/
- Kubernetes: https://kubernetes.io/docs/
- Go Best Practices: https://golang.org/doc/effective_go
- Redis: https://redis.io/documentation
- JWT Best Practices: https://tools.ietf.org/html/rfc8725

---

**Ready to build production-grade recruitment platform!** 🚀
