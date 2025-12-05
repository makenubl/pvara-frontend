#!/bin/bash

# PVARA Backend Project Setup
# Creates directory structure and starter files

mkdir -p pvara-backend/{services,infrastructure,docs}

# Create service directories
mkdir -p pvara-backend/services/{auth-service,jobs-service,applications-service,candidates-service,interviews-service,notifications-service}

# Create infrastructure directories
mkdir -p pvara-backend/infrastructure/{kubernetes,terraform,docker,monitoring}

# Create documentation
mkdir -p pvara-backend/docs/{api,architecture,database}

# Initialize Go services
for service in auth-service jobs-service applications-service candidates-service interviews-service; do
  mkdir -p pvara-backend/services/$service/{cmd,internal/model,internal/handler,internal/service,internal/repository,tests}
  cd pvara-backend/services/$service
  go mod init github.com/makenubl/pvara-backend/$service
  cd ../../../
done

# Initialize Node.js services
for service in notifications-service; do
  mkdir -p pvara-backend/services/$service/{src/{controllers,services,models,middleware},tests}
  cd pvara-backend/services/$service
  npm init -y
  cd ../../../
done

echo "✅ Backend project structure created!"
echo ""
echo "Project structure:"
tree -L 3 pvara-backend/

echo ""
echo "Next steps:"
echo "1. Create docker-compose.yml for local development"
echo "2. Set up GitHub Actions CI/CD"
echo "3. Configure Kubernetes manifests"
echo "4. Initialize database migrations"
