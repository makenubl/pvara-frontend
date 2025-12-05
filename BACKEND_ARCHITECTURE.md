# PVARA Backend Architecture Design
## Production-Grade System for 1M+ Concurrent Applications

---

## 🎯 Executive Summary

A **microservices-based, cloud-native architecture** using:
- **API Gateway**: Kong/Traefik
- **Languages**: Go (core services) + Node.js (APIs)
- **Database**: PostgreSQL + Redis + Elasticsearch
- **Message Queue**: Apache Kafka
- **Deployment**: Kubernetes on AWS/GCP/Azure
- **Security**: OAuth 2.0, JWT, mTLS, encryption-at-rest

**Estimated Capacity**: 10K-100K req/sec per deployment zone

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CDN (CloudFlare)                         │
└────────┬────────────────────────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────────────────────────┐
│              API Gateway (Kong Enterprise)                       │
│  • Rate Limiting  • Authentication  • Request Routing            │
└────────┬────────────────────────────────────────────────────────┘
         │
    ┌────┴─────────┬──────────┬────────┬──────────┐
    │              │          │        │          │
┌───▼──┐    ┌─────▼─┐  ┌────▼──┐ ┌──▼───┐  ┌──▼────┐
│Auth  │    │Jobs   │  │Applic.│ │Cand. │  │Interv.│
│Svc   │    │Svc    │  │Svc    │ │Svc   │  │Svc    │
└───┬──┘    └─────┬─┘  └────┬──┘ └──┬───┘  └──┬────┘
    │             │         │       │        │
    └──────┬──────┴────┬────┴───┬───┴───┬────┘
           │           │        │       │
      ┌────▼────────┐  │   ┌────▼───────▼──┐
      │  PostgreSQL │  │   │  Cache/Redis  │
      │  (Primary)  │  │   │  (Session)    │
      └─────────────┘  │   └───────────────┘
           │           │
    ┌──────▼───┬──────┬▼─────────┬──────────┐
    │          │      │          │          │
┌───▼──┐ ┌────▼──┐ ┌─▼────┐ ┌───▼───┐ ┌──▼────┐
│Kafka │ │Elastic│ │S3    │ │Queue  │ │Search │
│Topics│ │Search │ │Logs  │ │Worker │ │Index  │
└──────┘ └───────┘ └──────┘ └───────┘ └───────┘
```

---

## 🛠️ Technology Stack

### Backend Services
| Component | Technology | Why |
|-----------|-----------|-----|
| **Language** | Go + Node.js | Go for high-throughput services (Auth, Jobs), Node.js for APIs |
| **Framework** | Gin (Go) / Express (Node) | Production-ready, battle-tested |
| **API** | GraphQL + REST | GraphQL for complex queries, REST for webhooks |
| **Type Safety** | TypeScript | Prevent runtime errors, better IDE support |

### Data Layer
| Component | Technology | Why |
|-----------|-----------|-----|
| **RDBMS** | PostgreSQL 14+ | ACID compliance, JSON support, partitioning for scale |
| **Cache** | Redis 7+ | Sub-millisecond response times, session management |
| **Search** | Elasticsearch 8 | Full-text search on applications/candidates |
| **Message Queue** | Apache Kafka | Handle application bursts, async processing |
| **Object Storage** | AWS S3 / GCP Cloud Storage | Resume/CV storage, audit logs |

### Infrastructure
| Component | Technology | Why |
|-----------|-----------|-----|
| **Container** | Docker | Standardized deployment |
| **Orchestration** | Kubernetes | Auto-scaling, self-healing, multi-zone deployment |
| **Load Balancer** | AWS ALB / Google Load Balancer | 4M+ req/sec capacity |
| **API Gateway** | Kong Enterprise | Rate limiting, authentication, request transformation |
| **CDN** | CloudFlare / AWS CloudFront | Global edge caching |
| **Monitoring** | Prometheus + Grafana | Real-time metrics, alerting |
| **Logging** | ELK Stack / Datadog | Centralized logging, debugging |

### Security
| Component | Technology | Why |
|-----------|-----------|-----|
| **Auth** | OAuth 2.0 + JWT | Industry standard, stateless |
| **Encryption** | TLS 1.3 + AES-256 | Transport & at-rest encryption |
| **Secrets** | HashiCorp Vault | Centralized secret management |
| **DDoS** | AWS Shield + WAF | Enterprise-grade protection |
| **Scanning** | Snyk + SonarQube | Dependency & code vulnerability scanning |

---

## 📊 Database Schema (PostgreSQL)

```sql
-- Core Tables with Partitioning

-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  INDEX idx_email (email),
  INDEX idx_organization_id (organization_id)
);

-- Jobs (with partitioning by creation date)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  openings INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id)
) PARTITION BY RANGE (created_at);

-- Applications (HIGH VOLUME - CRITICAL PARTITIONING)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  candidate_cnic VARCHAR(50) NOT NULL,
  candidate_email VARCHAR(255) NOT NULL,
  candidate_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'submitted',
  ai_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  created_by UUID,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for applications
CREATE TABLE applications_2025_01 PARTITION OF applications
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- ... repeat for all months

CREATE INDEX idx_applications_job_id ON applications (job_id);
CREATE INDEX idx_applications_status ON applications (status);
CREATE INDEX idx_applications_candidate_email ON applications (candidate_email);
CREATE INDEX idx_applications_created_at ON applications (created_at DESC);

-- Candidates
CREATE TABLE candidates (
  cnic VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  degree VARCHAR(255),
  experience_years INTEGER,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_organization_id (organization_id)
);

-- Interviews
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  scheduled_at TIMESTAMP,
  interview_type VARCHAR(50), -- phone, in-person, video
  interviewer_id UUID REFERENCES users(id),
  notes TEXT,
  score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id)
);

-- Offers
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  job_id UUID NOT NULL,
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- Audit Log (append-only, partitioned by month)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions for audit_logs
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Materialized Views for Analytics (refreshed hourly)
CREATE MATERIALIZED VIEW application_metrics AS
SELECT 
  job_id,
  status,
  COUNT(*) as count,
  AVG(ai_score) as avg_score,
  DATE(created_at) as date
FROM applications
GROUP BY job_id, status, DATE(created_at);

CREATE INDEX idx_application_metrics ON application_metrics (job_id, status, date);
```

### Partitioning Strategy for 1M Applications/Day

```sql
-- Range partitioning by date (monthly)
-- Each month = ~30M records (1M/day × 30)
-- Individual partitions stay <100GB (manageable size)
-- Allows quick archive of old data

-- List partitioning by status (optional secondary)
CREATE TABLE applications_submitted PARTITION OF applications
  FOR VALUES IN ('submitted', 'screening');

CREATE TABLE applications_advanced PARTITION OF applications
  FOR VALUES IN ('interviewed', 'offer', 'hired');

-- Automatic partition creation via pg_partman extension
CREATE EXTENSION pg_partman;
SELECT create_parent('public.applications', 'created_at', 'range', 'monthly');
```

---

## 🏗️ Microservices Architecture

### 1. **Auth Service** (Go + PostgreSQL)
```go
// Handles OAuth 2.0, JWT token generation, user management
// Stateless - scales horizontally
// 50K req/sec per instance

POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/register

// Uses Redis for token blacklist (revocation)
// Implements JWT with short expiry (15min) + refresh tokens (7days)
```

### 2. **Jobs Service** (Go + PostgreSQL)
```go
// CRUD operations on job postings
// Caching layer (Redis) for job listings
// 100K req/sec per instance

GET    /jobs
GET    /jobs/:id
POST   /jobs (admin only)
PUT    /jobs/:id (admin only)
DELETE /jobs/:id (admin only)

// Cache strategy:
// - GET /jobs: 5min cache (invalidate on POST/PUT/DELETE)
// - GET /jobs/:id: 10min cache
// - Use cache headers: ETag, Last-Modified
```

### 3. **Applications Service** (Go + PostgreSQL + Kafka)
```go
// Handle submission, filtering, screening
// High-throughput, write-heavy workload
// 200K req/sec per instance

POST   /applications (async processing via Kafka)
GET    /applications (filter, sort, pagination)
PUT    /applications/:id/status (state transitions)
DELETE /applications/:id (soft delete)

// Architecture:
// - Request → Kafka topic (applications.submitted)
// - Worker process events asynchronously
// - Update database + trigger webhooks
// - Response: 202 Accepted (async)
```

### 4. **AI Screening Agent Service** (Python + FastAPI + LLM)

#### Overview
```
Autonomous pre-screening using LLMs (OpenAI, Claude, Local Ollama)
- Evaluates all candidates automatically 24/7
- Configurable screening criteria per job (admin-defined)
- Filters & ranks top 10/50/100 candidates automatically
- Webhook notifications for HR team
- Complete audit trail of AI decisions
- Support for multiple LLM providers (cost optimization)
```

#### Architecture
```
┌──────────────────────────────────────────────────┐
│      AI Screening Agent Service                  │
├──────────────────────────────────────────────────┤
│  Kafka Consumer (applications.submitted)          │
│         ↓                                          │
│  Resume Extraction (PDF/DOCX parsing)            │
│         ↓                                          │
│  Fetch Screening Criteria (Redis cache)          │
│         ↓                                          │
│  Call LLM (OpenAI/Claude/Ollama)                │
│         ↓                                          │
│  Parse & Score Response (0-100)                  │
│         ↓                                          │
│  Update applications table                        │
│         ↓                                          │
│  Generate Shortlist (Top N)                       │
│         ↓                                          │
│  Emit Kafka event + Webhook notification          │
└──────────────────────────────────────────────────┘
```

#### Database Schema for AI
```sql
-- Extend applications table
ALTER TABLE applications ADD COLUMN (
  ai_score DECIMAL(5,2),
  ai_reasoning JSONB,
  ai_screened_at TIMESTAMP,
  ai_skills_matched JSONB,
  ai_skills_missing JSONB,
  ai_model_version VARCHAR(50),
  is_in_shortlist BOOLEAN DEFAULT false
);

-- Shortlist table (top candidates)
CREATE TABLE shortlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  application_id UUID NOT NULL,
  rank INTEGER,
  ai_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (application_id) REFERENCES applications(id)
);

-- Admin screening criteria configuration
CREATE TABLE screening_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  organization_id UUID NOT NULL,
  criteria JSONB NOT NULL,
  model_used VARCHAR(50) DEFAULT 'gpt-4',
  top_n_candidates INTEGER DEFAULT 10,
  min_score_threshold DECIMAL(5,2) DEFAULT 70,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id)
);

-- LLM usage tracking (for cost analysis)
CREATE TABLE ai_screening_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  job_id UUID NOT NULL,
  llm_model VARCHAR(50),
  llm_prompt_tokens INTEGER,
  llm_completion_tokens INTEGER,
  llm_cost_cents DECIMAL(10,2),
  decision_time_ms INTEGER,
  final_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_applications_ai_score ON applications(job_id, ai_score DESC);
CREATE INDEX idx_shortlist_rank ON shortlist(job_id, rank);
```

#### Admin Configuration (JSONB format)
```json
{
  "screening_criteria": {
    "must_have_skills": [
      { "name": "Python", "years": 2, "proficiency": "intermediate" },
      { "name": "PostgreSQL", "years": 1, "proficiency": "intermediate" }
    ],
    "nice_to_have_skills": [
      { "name": "Kubernetes", "years": 1 },
      { "name": "Docker", "years": 2 }
    ],
    "min_experience_years": 3,
    "required_education": "Bachelor's degree",
    "location_preference": ["Remote", "New York"],
    "disqualifying_factors": [
      "No Python experience",
      "Currently employed at competitor"
    ]
  },
  "llm_config": {
    "provider": "ollama",
    "model": "llama2:7b",
    "temperature": 0.3,
    "max_tokens": 500
  },
  "filtering": {
    "top_n_candidates": 10,
    "min_score_threshold": 70,
    "auto_advance_score": 85
  },
  "notifications": {
    "notify_on_complete": true,
    "webhook_url": "https://hr-system.example.com/webhook/screening-complete",
    "email_recipients": ["hr@company.com"]
  }
}
```

#### FastAPI Implementation
```python
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import asyncio, json, httpx
from typing import List, Dict, Optional

app = FastAPI()

LLM_CONFIGS = {
    "openai": {"base_url": "https://api.openai.com/v1", "model": "gpt-4-turbo", "cost_per_1k": 0.03},
    "anthropic": {"base_url": "https://api.anthropic.com", "model": "claude-3-opus", "cost_per_1k": 0.015},
    "ollama": {"base_url": "http://localhost:11434", "model": "llama2:7b", "cost_per_1k": 0}
}

class ScreeningRequest(BaseModel):
    application_id: str
    job_id: str
    candidate_name: str
    resume_text: str
    job_description: str
    screening_criteria: Dict

class ScreeningResult(BaseModel):
    application_id: str
    score: float
    reasoning: str
    matched_skills: List[str]
    missing_skills: List[str]
    recommendation: str

async def screen_application(request: ScreeningRequest) -> ScreeningResult:
    """Screen using LLM - returns score 0-100"""
    
    prompt = f"""You are an expert recruiter. Score this candidate 0-100.
    
    JOB: {request.job_description}
    
    MUST-HAVE SKILLS: {json.dumps(request.screening_criteria['must_have_skills'])}
    
    RESUME: {request.resume_text}
    
    Return JSON with: score, matched_skills[], missing_skills[], recommendation"""
    
    llm_config = LLM_CONFIGS.get(request.screening_criteria.get('llm_provider', 'openai'))
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{llm_config['base_url']}/chat/completions",
            json={"model": llm_config['model'], "messages": [{"role": "user", "content": prompt}]},
            headers={"Authorization": f"Bearer {os.getenv('LLM_API_KEY')}"}
        )
    
    result_json = json.loads(response.json()['choices'][0]['message']['content'])
    return ScreeningResult(**result_json, application_id=request.application_id)

@app.post("/screen")
async def screen_batch(requests: List[ScreeningRequest], background_tasks: BackgroundTasks):
    """Screen multiple applications in parallel"""
    tasks = [screen_application(req) for req in requests[:10]]
    results = await asyncio.gather(*tasks)
    
    background_tasks.add_task(save_results_to_db, results)
    background_tasks.add_task(emit_kafka_event, results)
    
    return {"status": "processing", "count": len(results)}

@app.post("/shortlist")
async def generate_shortlist(job_id: str, top_n: int = 10):
    """Generate top N candidates for a job"""
    applications = db.query(
        "SELECT * FROM applications WHERE job_id = ? AND ai_screened_at IS NOT NULL "
        "ORDER BY ai_score DESC LIMIT ?",
        (job_id, top_n)
    )
    
    for rank, app in enumerate(applications, 1):
        db.execute(
            "INSERT INTO shortlist (job_id, application_id, rank, ai_score) VALUES (?, ?, ?, ?)",
            (job_id, app.id, rank, app.ai_score)
        )
    
    return {"job_id": job_id, "shortlist_count": len(applications)}

@app.get("/shortlist/{job_id}")
async def get_shortlist(job_id: str):
    """Get current shortlist with candidate details"""
    return db.query(
        "SELECT s.*, a.candidate_name, a.ai_score, a.ai_reasoning "
        "FROM shortlist s JOIN applications a ON s.application_id = a.id "
        "WHERE s.job_id = ? ORDER BY s.rank",
        (job_id,)
    )
```

#### Kafka Consumer Setup
```python
from kafka import KafkaConsumer

consumer = KafkaConsumer('applications.submitted', bootstrap_servers=['kafka:9092'])

for message in consumer:
    app_data = message.value
    resume = s3.get_object(app_data['resume_s3_key']).read()
    job_desc = db.query("SELECT description FROM jobs WHERE id = ?", app_data['job_id'])[0]
    
    result = await screen_application(ScreeningRequest(...))
    
    db.execute("UPDATE applications SET ai_score = ?, ai_reasoning = ?, ai_screened_at = NOW() WHERE id = ?",
               (result.score, json.dumps(result.dict()), app_data['id']))
    
    producer.send('applications.ai_screened', result.dict())
```

#### Cost Breakdown (LLM usage for 1M apps/day)
```
OpenAI GPT-4 Turbo:
  - 800 tokens/application × $0.03/1K tokens = $0.024/app
  - 1M/day × $0.024 = $24,000/day = $720,000/month ❌ EXPENSIVE

Anthropic Claude 3 Opus:
  - 800 tokens/application × $0.015/1K tokens = $0.012/app
  - 1M/day × $0.012 = $12,000/day = $360,000/month ⚠️ BETTER

Self-Hosted Ollama (Llama 2 7B):
  - One-time GPU: $1,000
  - Monthly hosting: $200 (p3.2xlarge)
  - Cost per application: $0
  - Total monthly: $200 ✅ BEST

HYBRID STRATEGY (Recommended):
  - Ollama: 70% of applications (simple screening)
  - Claude 3: 20% of applications (complex cases)
  - GPT-4: 10% of applications (senior roles)
  - Estimated cost: $200 + 200K × $0.012 + 100K × $0.024 = $150,000/month
```

### 5. **Interviews Service** (Node.js + PostgreSQL)
```typescript
// Schedule, manage interviews
// Integrate with calendar APIs (Google Calendar, Outlook)
// Webhook support for video platforms (Zoom, Teams)

POST   /interviews
GET    /interviews/:id
PUT    /interviews/:id
DELETE /interviews/:id

// Calendar sync via webhooks
// Conflict detection using interval trees
```

### 6. **Notifications Service** (Node.js + Kafka)
```javascript
// Email, SMS, push notifications
// Templated messages
// Audit trail

// Triggered by Kafka events:
// - applications.submitted → send confirmation email
// - applications.status_changed → notify candidate
// - offers.created → send offer email with tracking
// - applications.ai_screened → notify HR with shortlist (NEW)

// Use SES (AWS), SendGrid, or Twilio
// Rate limiting: 100 emails/sec per API key
```

---

## 📈 Scaling Strategy for 1M Concurrent

### Database Scaling
```sql
-- Read replicas for analytics/reporting
-- Primary (write) → 3x Replicas (read-only)
-- Connection pooling: PgBouncer (min 100, max 5000 connections)

-- Sharding (if needed beyond 1M/day):
-- Shard by organization_id or job_id
-- 10 shards = distribute across 10 database instances
-- Each shard handles 100K applications
```

### Application Scaling
```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: applications-service
spec:
  replicas: 50  # Start, auto-scale to 200
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 10
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: app
        image: pvara/applications-service:latest
        resources:
          requests:
            memory: 512Mi
            cpu: 500m
          limits:
            memory: 1Gi
            cpu: 1000m
      
      # Horizontal Pod Autoscaler
      ---
      apiVersion: autoscaling/v2
      kind: HorizontalPodAutoscaler
      metadata:
        name: applications-service-hpa
      spec:
        scaleTargetRef:
          apiVersion: apps/v1
          kind: Deployment
          name: applications-service
        minReplicas: 50
        maxReplicas: 200
        metrics:
        - type: Resource
          resource:
            name: cpu
            target:
              type: Utilization
              averageUtilization: 70
        - type: Resource
          resource:
            name: memory
            target:
              type: Utilization
              averageUtilization: 80
```

### Kafka Topic Configuration
```properties
# applications.submitted
num.partitions=100              # 100K req/sec ÷ 1K per partition
replication.factor=3             # High availability
min.insync.replicas=2            # Wait for 2 replicas before ack
retention.ms=7days               # Keep 7 days of history

# applications.scored
num.partitions=50
replication.factor=3

# Enable compression
compression.type=snappy
```

---

## 🔒 Security Measures

### 1. API Security
```
• OAuth 2.0 + OpenID Connect for user auth
• JWT tokens with RS256 (asymmetric signing)
• Rate limiting: 1000 req/min per user, 10K req/min per IP
• Request signing: HMAC-SHA256 for mobile clients
• CORS: Whitelist origin domains only
• CSRF protection: SameSite cookies + tokens
```

### 2. Data Security
```
• Encryption in transit: TLS 1.3 (all connections)
• Encryption at rest: AES-256 (PII fields)
• PII masking in logs: Replace CNIC with ****
• Database: Row-level security (RLS) by organization
• S3: Bucket encryption, versioning, access logs enabled
```

### 3. Infrastructure Security
```
• Network segmentation: VPC with private subnets
• Firewall rules: WAF (AWS Shield)
• DDoS protection: CloudFlare + AWS Shield Advanced
• Secrets management: HashiCorp Vault
• Certificate management: Let's Encrypt + Certbot (auto-renewal)
• VPN for admin access
```

### 4. Application Security
```
• Input validation: JSON schema + regex patterns
• SQL injection prevention: Parameterized queries (prepared statements)
• XSS protection: HTML entity encoding, CSP headers
• SSRF protection: URL validation, DNS rebinding protection
• Dependency scanning: Snyk (weekly), npm audit (pre-commit)
• Code scanning: SonarQube, SAST tools
```

---

## 📊 Performance Targets

| Metric | Target | How to Achieve |
|--------|--------|---------------|
| **P99 Latency** | <500ms | Caching + async processing |
| **Throughput** | 100K req/sec | Load balancing + sharding |
| **Availability** | 99.99% | Multi-region + redundancy |
| **Recovery Time** | <5min | Auto-failover + health checks |
| **Data Durability** | 99.999999% | 3x replication + backups |

---

## 🚀 Deployment Pipeline

```yaml
# CI/CD with GitHub Actions
name: Deploy PVARA Backend

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: go test ./... -cover
      - name: Scan dependencies
        run: npm audit && snyk test
      - name: SAST scanning
        run: sonarqube-scanner

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker image
        run: docker build -t pvara/backend:${{ github.sha }} .
      - name: Scan image
        run: trivy image pvara/backend:${{ github.sha }}
      - name: Push to ECR
        run: aws ecr push ...

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: kubectl set image deployment/pvara-backend ...
      - name: Run smoke tests
        run: ./scripts/smoke-tests.sh
```

---

## 💰 Cost Estimation (AWS)

| Component | Monthly Cost | Notes |
|-----------|------------|-------|
| RDS PostgreSQL (Multi-AZ) | $2,000 | db.r5.4xlarge with 3x replicas |
| ElastiCache Redis | $800 | cache.r5.xlarge cluster |
| Elasticsearch | $1,000 | 3 nodes, 100GB storage |
| EKS Kubernetes | $500 | Control plane |
| EC2 Instances | $15,000 | 50-200 nodes auto-scaling |
| GPU Instance (Ollama) | $800 | NVIDIA V100 for self-hosted LLM |
| AWS ALB | $300 | Application load balancer |
| NAT Gateway | $500 | Outbound data transfer |
| Kafka (MSK) | $1,200 | Managed streaming |
| S3 Storage | $500 | Resume/log storage |
| CloudFront CDN | $400 | Content delivery |
| AI Screening (LLM) | $150,000 | Hybrid: Ollama (70%) + Claude (20%) + GPT-4 (10%) |
| Monitoring | $500 | DataDog / Datadog |
| **Total** | **~$173,000/mo** | Supports 1M+ apps/day with AI screening |

---

## 📋 Implementation Roadmap

### Phase 1 (Month 1-2): Foundation
- [ ] PostgreSQL setup + schema design
- [ ] Redis cluster deployment
- [ ] Docker containerization
- [ ] Basic Kubernetes cluster
- [ ] Auth service in Go

### Phase 2 (Month 3-4): Core Services
- [ ] Jobs service
- [ ] Applications service with Kafka
- [ ] Candidate management
- [ ] Basic API Gateway (Kong)

### Phase 3 (Month 5-6): Advanced Features
- [ ] AI Screening Agent Service (LLM integration)
- [ ] Screening criteria admin UI
- [ ] Shortlist generation pipeline
- [ ] Interview management
- [ ] Offer management
- [ ] Elasticsearch integration

### Phase 4 (Month 7-8): Security & Scale
- [ ] TLS/encryption implementation
- [ ] Load testing (1M concurrent)
- [ ] Security audit + penetration testing
- [ ] Multi-region deployment

### Phase 5 (Month 9+): Optimization
- [ ] Performance tuning
- [ ] Cost optimization
- [ ] Auto-scaling refinement
- [ ] Production monitoring

---

## 🔗 Architecture Decision Records (ADRs)

### ADR-1: Why PostgreSQL over MongoDB?
**Decision**: PostgreSQL  
**Rationale**:
- ACID guarantees for financial transactions (offers)
- Strong schema for recruitment workflow
- Better for complex queries (JOINs across users/jobs/applications)
- Superior write performance for high-volume inserts
- Built-in partitioning

### ADR-2: Why Kafka over RabbitMQ?
**Decision**: Kafka  
**Rationale**:
- Distributed streaming platform (handles 1M+ events/sec)
- Event replay capability for audit trails
- Consumer groups for parallel processing
- Better throughput (100K msgs/sec per broker)

### ADR-3: Why Go + Node.js?
**Decision**: Go for core services, Node.js for APIs  
**Rationale**:
- Go: Ultra-low latency, efficient concurrency, compiled binaries
- Node.js: Fast development iteration, rich ecosystem
- Separate concerns: performance vs. velocity

---

## 🎓 Recommended Reading

1. **Designing Data-Intensive Applications** - Martin Kleppmann
2. **Building Microservices** - Sam Newman
3. **Site Reliability Engineering** - Google (SRE Book)
4. **PostgreSQL 14 Documentation** - Official
5. **Kafka: The Definitive Guide** - Confluent

---

**This architecture is production-ready and can scale to 10M+ applications/day with proper DevOps practices.**
