#!/bin/bash

# Azure Container Apps Setup Script
# This script sets up the Azure Container Apps infrastructure for the funnel-builder-api

set -e

# Configuration variables
RESOURCE_GROUP="digitalsite-container-apps-rg"
LOCATION="eastus"
ACR_NAME="digitalsiteacr"
CONTAINER_APP_ENV_STAGING="digitalsite-staging-env"
CONTAINER_APP_ENV_PROD="digitalsite-prod-env"
CONTAINER_APP_NAME_STAGING="digitalsite-api-staging"
CONTAINER_APP_NAME_PROD="digitalsite-api-prod"
LOG_ANALYTICS_WORKSPACE="digitalsite-logs"
REDIS_NAME="digitalsite-redis"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Azure Container Apps Setup...${NC}"

# Check if logged into Azure
echo -e "${YELLOW}Checking Azure login status...${NC}"
if ! az account show &>/dev/null; then
    echo -e "${RED}Not logged into Azure. Please run 'az login' first.${NC}"
    exit 1
fi

# Display current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${GREEN}Using subscription: $SUBSCRIPTION${NC}"

# Create Resource Group
echo -e "${YELLOW}Creating resource group...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION || true

# Create Azure Container Registry
echo -e "${YELLOW}Creating Azure Container Registry...${NC}"
az acr create \
    --resource-group $RESOURCE_GROUP \
    --name $ACR_NAME \
    --sku Basic \
    --admin-enabled true

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

echo -e "${GREEN}ACR created: $ACR_NAME.azurecr.io${NC}"

# Create Azure Redis Cache
echo -e "${YELLOW}Creating Azure Redis Cache...${NC}"
az redis create \
    --location $LOCATION \
    --name $REDIS_NAME \
    --resource-group $RESOURCE_GROUP \
    --sku Basic \
    --vm-size c0 || true

# Get Redis connection details
if az redis show --name $REDIS_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
    REDIS_HOST=$(az redis show --name $REDIS_NAME --resource-group $RESOURCE_GROUP --query hostName -o tsv)
    REDIS_KEY=$(az redis list-keys --name $REDIS_NAME --resource-group $RESOURCE_GROUP --query primaryKey -o tsv)
    echo -e "${GREEN}Redis Cache: $REDIS_HOST${NC}"
fi

# Create Log Analytics Workspace
echo -e "${YELLOW}Creating Log Analytics Workspace...${NC}"
az monitor log-analytics workspace create \
    --resource-group $RESOURCE_GROUP \
    --workspace-name $LOG_ANALYTICS_WORKSPACE \
    --location $LOCATION

# Get Log Analytics Workspace details
LOG_ANALYTICS_WORKSPACE_ID=$(az monitor log-analytics workspace show \
    --resource-group $RESOURCE_GROUP \
    --workspace-name $LOG_ANALYTICS_WORKSPACE \
    --query customerId -o tsv)

LOG_ANALYTICS_WORKSPACE_KEY=$(az monitor log-analytics workspace get-shared-keys \
    --resource-group $RESOURCE_GROUP \
    --workspace-name $LOG_ANALYTICS_WORKSPACE \
    --query primarySharedKey -o tsv)

# Create Container Apps Environment for Staging
echo -e "${YELLOW}Creating Container Apps Environment for Staging...${NC}"
az containerapp env create \
    --name $CONTAINER_APP_ENV_STAGING \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --logs-workspace-id $LOG_ANALYTICS_WORKSPACE_ID \
    --logs-workspace-key $LOG_ANALYTICS_WORKSPACE_KEY

# Create Container Apps Environment for Production
echo -e "${YELLOW}Creating Container Apps Environment for Production...${NC}"
az containerapp env create \
    --name $CONTAINER_APP_ENV_PROD \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --logs-workspace-id $LOG_ANALYTICS_WORKSPACE_ID \
    --logs-workspace-key $LOG_ANALYTICS_WORKSPACE_KEY

# Build and push initial Docker image
echo -e "${YELLOW}Building and pushing initial Docker image...${NC}"
if [ -f "../Dockerfile" ]; then
    cd ..
    docker build -t $ACR_NAME.azurecr.io/digitalsite-api:initial .
    
    # Login to ACR
    echo $ACR_PASSWORD | docker login $ACR_NAME.azurecr.io -u $ACR_USERNAME --password-stdin
    
    # Push image
    docker push $ACR_NAME.azurecr.io/digitalsite-api:initial
    cd scripts
else
    echo -e "${YELLOW}Dockerfile not found. Skipping initial image build.${NC}"
fi

# Create staging Container App with optimized performance
echo -e "${YELLOW}Creating Staging Container App with enhanced performance...${NC}"
az containerapp create \
    --name $CONTAINER_APP_NAME_STAGING \
    --resource-group $RESOURCE_GROUP \
    --environment $CONTAINER_APP_ENV_STAGING \
    --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
    --target-port 3000 \
    --ingress 'external' \
    --min-replicas 2 \
    --max-replicas 10 \
    --cpu 1.0 \
    --memory 2.0Gi

# Create production Container App with high performance
echo -e "${YELLOW}Creating Production Container App with high performance...${NC}"
az containerapp create \
    --name $CONTAINER_APP_NAME_PROD \
    --resource-group $RESOURCE_GROUP \
    --environment $CONTAINER_APP_ENV_PROD \
    --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
    --target-port 3000 \
    --ingress 'external' \
    --min-replicas 3 \
    --max-replicas 30 \
    --cpu 2.0 \
    --memory 4.0Gi

# Create secrets for staging
echo -e "${YELLOW}Setting up secrets for Staging Container App...${NC}"
echo -e "${YELLOW}Please set the following secrets in your GitHub repository:${NC}"
echo ""
echo -e "${GREEN}Required GitHub Secrets:${NC}"
echo "AZURE_CREDENTIALS - Service principal credentials (JSON format)"
echo ""
echo "Database and Cache:"
echo "  DATABASE_URL - PostgreSQL connection string"
echo "  REDIS_URL - Redis connection string"
echo "  JWT_SECRET - JWT secret key"
echo ""
echo "Azure Storage:"
echo "  AZURE_STORAGE_CONNECTION_STRING - Azure storage connection string"
echo "  AZURE_STORAGE_CONTAINER_NAME - Container name (template-images)"
echo "  STORAGE_URL - Storage URL"
echo ""
echo "Email Service:"
echo "  SENDGRID_API_KEY - SendGrid API key"
echo "  SENDGRID_FROM_EMAIL - From email address"
echo ""
echo "Cloudflare:"
echo "  CF_API_TOKEN - Cloudflare API token"
echo "  CF_ACCOUNT_ID - Cloudflare account ID"
echo "  CF_VERIFICATION_DOMAIN - Verification domain"
echo "  CF_DOMAIN - Main domain"
echo "  CF_ZONE_ID - Zone ID"
echo ""
echo "Workspace:"
echo "  WORKSPACE_DOMAIN - Workspace domain"
echo "  WORKSPACE_ZONE_ID - Workspace zone ID"
echo "  WORKSPACE_IP - Workspace IP"
echo ""
echo "Payment:"
echo "  MAMOPAY_API_KEY - Mamopay API key"
echo "  MAMOPAY_API_URL - Mamopay API URL"
echo ""
echo "Application:"
echo "  FRONTEND_URL - Frontend application URL"
echo ""

# Output important information
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo -e "${GREEN}Resource Group:${NC} $RESOURCE_GROUP"
echo -e "${GREEN}ACR Name:${NC} $ACR_NAME.azurecr.io"
echo -e "${GREEN}ACR Username:${NC} $ACR_USERNAME"
echo -e "${GREEN}Staging Environment:${NC} $CONTAINER_APP_ENV_STAGING"
echo -e "${GREEN}Production Environment:${NC} $CONTAINER_APP_ENV_PROD"
echo -e "${GREEN}Staging App:${NC} $CONTAINER_APP_NAME_STAGING"
echo -e "${GREEN}Production App:${NC} $CONTAINER_APP_NAME_PROD"
echo ""

# Get Container App URLs
STAGING_URL=$(az containerapp show \
    --name $CONTAINER_APP_NAME_STAGING \
    --resource-group $RESOURCE_GROUP \
    --query properties.configuration.ingress.fqdn -o tsv)

PROD_URL=$(az containerapp show \
    --name $CONTAINER_APP_NAME_PROD \
    --resource-group $RESOURCE_GROUP \
    --query properties.configuration.ingress.fqdn -o tsv)

echo -e "${GREEN}Staging URL:${NC} https://$STAGING_URL"
echo -e "${GREEN}Production URL:${NC} https://$PROD_URL"
echo ""

# Display Redis connection info if available
if [ ! -z "$REDIS_HOST" ]; then
    echo -e "${GREEN}Redis Connection:${NC}"
    echo "  Host: $REDIS_HOST"
    echo "  Connection String: rediss://:$REDIS_KEY@$REDIS_HOST:6380"
    echo ""
fi

# Create service principal for GitHub Actions
echo -e "${YELLOW}Creating Service Principal for GitHub Actions...${NC}"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

SP_OUTPUT=$(az ad sp create-for-rbac \
    --name "digitalsite-github-actions" \
    --role contributor \
    --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
    --sdk-auth)

echo -e "${GREEN}Service Principal created. Add this as AZURE_CREDENTIALS secret in GitHub:${NC}"
echo "$SP_OUTPUT"
echo ""

echo -e "${GREEN}Next Steps:${NC}"
echo "1. Add the AZURE_CREDENTIALS secret to your GitHub repository"
echo "2. Configure other required secrets in GitHub"
echo "3. Update your database and Redis connection strings"
echo "4. Push to the develop branch to trigger deployment"