#!/bin/bash

# Azure Container Apps Secret Configuration Script
# This script sets environment variables and secrets for Azure Container Apps
# Usage: ./scripts/set-azure-secrets.sh [test|production]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="digitalsite-eu-rg"
ENVIRONMENT=${1:-dev}

# Set container app name based on environment
if [ "$ENVIRONMENT" == "production" ]; then
    CONTAINER_APP_NAME="digitalsite-api-test"  # Production runs on test container
    echo -e "${YELLOW}Setting secrets for PRODUCTION environment${NC}"
    echo -e "${YELLOW}(Container: digitalsite-api-test)${NC}"
elif [ "$ENVIRONMENT" == "dev" ]; then
    CONTAINER_APP_NAME="digitalsite-api-dev"
    echo -e "${YELLOW}Setting secrets for DEVELOPMENT environment${NC}"
elif [ "$ENVIRONMENT" == "test" ]; then
    # Legacy support - maps to production
    CONTAINER_APP_NAME="digitalsite-api-test"
    echo -e "${YELLOW}Setting secrets for TEST environment (PRODUCTION)${NC}"
else
    echo -e "${RED}Error: Invalid environment. Use 'dev' or 'production'${NC}"
    exit 1
fi

echo -e "${GREEN}Container App: ${CONTAINER_APP_NAME}${NC}"
echo -e "${GREEN}Resource Group: ${RESOURCE_GROUP}${NC}"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    echo "Install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
echo "Checking Azure login status..."
az account show &> /dev/null || {
    echo -e "${RED}Error: Not logged in to Azure${NC}"
    echo "Please run: az login"
    exit 1
}

echo -e "${GREEN}✓ Azure CLI authenticated${NC}"
echo ""

# Read secrets from .env file
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

echo "Reading secrets from .env file..."
echo ""

# Export environment variables from .env (excluding comments and empty lines)
export $(grep -v '^#' .env | grep -v '^$' | xargs)

# Step 1: Set secrets in Container App
echo -e "${YELLOW}Step 1/2: Setting Container App secrets...${NC}"
echo ""

az containerapp secret set \
  --name "$CONTAINER_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --secrets \
    "database-url=$DATABASE_URL" \
    "jwt-secret=$JWT_SECRET" \
    "redis-password=$REDIS_PASSWORD" \
    "redis-url=$REDIS_URL" \
    "cf-api-token=$CF_API_TOKEN" \
    "azure-storage-connection-string=$AZURE_STORAGE_CONNECTION_STRING" \
    "sendgrid-api-key=$SENDGRID_API_KEY" \
    "mamopay-api-key=$MAMOPAY_API_KEY" \
    "cron-secret-token=$CRON_SECRET_TOKEN" \
  --output none

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to set Container App secrets${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Secrets set successfully${NC}"
echo ""

# Step 2: Update environment variables to reference secrets
echo -e "${YELLOW}Step 2/2: Updating environment variables...${NC}"
echo ""

az containerapp update \
  --name "$CONTAINER_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --set-env-vars \
    "NODE_ENV=production" \
    "PORT=4444" \
    "DATABASE_URL=secretref:database-url" \
    "JWT_SECRET=secretref:jwt-secret" \
    "REDIS_HOST=$REDIS_HOST" \
    "REDIS_PORT=$REDIS_PORT" \
    "REDIS_PASSWORD=secretref:redis-password" \
    "REDIS_URL=secretref:redis-url" \
    "REDIS_DB=$REDIS_DB" \
    "REDIS_TLS=$REDIS_TLS" \
    "CF_API_TOKEN=secretref:cf-api-token" \
    "CF_ACCOUNT_ID=$CF_ACCOUNT_ID" \
    "CF_SUBDOMAIN=$CF_SUBDOMAIN" \
    "CF_ZONE_ID=$CF_ZONE_ID" \
    "STORAGE_URL=$STORAGE_URL" \
    "AZURE_STORAGE_CONNECTION_STRING=secretref:azure-storage-connection-string" \
    "AZURE_STORAGE_CONTAINER_NAME=$AZURE_STORAGE_CONTAINER_NAME" \
    "SENDGRID_API_KEY=secretref:sendgrid-api-key" \
    "SENDGRID_FROM_EMAIL=$SENDGRID_FROM_EMAIL" \
    "FRONTEND_URL=$FRONTEND_URL" \
    "WORKSPACE_DOMAIN=$WORKSPACE_DOMAIN" \
    "WORKSPACE_ZONE_ID=$WORKSPACE_ZONE_ID" \
    "WORKSPACE_IP=$WORKSPACE_IP" \
    "MAMOPAY_API_KEY=secretref:mamopay-api-key" \
    "MAMOPAY_API_URL=$MAMOPAY_API_URL" \
    "CRON_SECRET_TOKEN=secretref:cron-secret-token" \
    "OTEL_SERVICE_NAME=$OTEL_SERVICE_NAME" \
    "HONEYCOMB_API_KEY=$HONEYCOMB_API_KEY" \
    "HONEYCOMB_DATASET=$HONEYCOMB_DATASET" \
  --output none

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Successfully updated Container App configuration${NC}"
    echo ""

    # Get the Container App URL
    CONTAINER_APP_URL=$(az containerapp show \
      --name "$CONTAINER_APP_NAME" \
      --resource-group "$RESOURCE_GROUP" \
      --query properties.configuration.ingress.fqdn \
      -o tsv)

    echo -e "${GREEN}Container App URL: https://$CONTAINER_APP_URL${NC}"
    echo ""
    echo -e "${YELLOW}Note: The container app will restart to apply the new configuration${NC}"
else
    echo -e "${RED}✗ Failed to update Container App environment variables${NC}"
    exit 1
fi

# Show revision status
echo ""
echo "Recent revisions:"
az containerapp revision list \
  --name "$CONTAINER_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "[].{Name:name, Active:properties.active, Created:properties.createdTime, Traffic:properties.trafficWeight}" \
  --output table

echo ""
echo -e "${GREEN}✓ Secret configuration complete!${NC}"
