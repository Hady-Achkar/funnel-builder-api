#!/bin/bash

# Script to update Azure credentials in GitHub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Azure Credentials Update Script${NC}"
echo ""

# Check if azure-creds.json exists
if [ ! -f "azure-creds.json" ]; then
    echo -e "${RED}azure-creds.json not found!${NC}"
    echo "Creating template..."
    cat > azure-creds.json << 'EOF'
{
  "clientId": "55e50eab-b9f2-4229-976f-1f39023db975",
  "clientSecret": "REPLACE_WITH_YOUR_CLIENT_SECRET",
  "subscriptionId": "93dc0ddb-48f8-4a4f-abe0-81314b665856",
  "tenantId": "560080a9-15de-402a-9e11-2a469737ca1e"
}
EOF
    echo -e "${YELLOW}Template created. Please edit azure-creds.json and add your client secret.${NC}"
    exit 1
fi

# Check if placeholder is still there
if grep -q "REPLACE_WITH_YOUR_CLIENT_SECRET" azure-creds.json; then
    echo -e "${RED}Please replace REPLACE_WITH_YOUR_CLIENT_SECRET with your actual client secret in azure-creds.json${NC}"
    echo ""
    echo "You need the client secret (password) from when the service principal was created."
    echo "If you don't have it, you'll need to create a new one."
    echo ""
    echo "To create a new service principal (requires appropriate Azure AD permissions):"
    echo -e "${GREEN}az ad sp create-for-rbac \\
  --name \"digitalsite-container-apps-sp-$(date +%s)\" \\
  --role contributor \\
  --scopes /subscriptions/93dc0ddb-48f8-4a4f-abe0-81314b665856 \\
  --output json${NC}"
    exit 1
fi

# Validate JSON
echo -e "${YELLOW}Validating JSON format...${NC}"
if ! jq empty azure-creds.json 2>/dev/null; then
    echo -e "${RED}Invalid JSON format in azure-creds.json${NC}"
    exit 1
fi

# Check required fields
CLIENT_ID=$(jq -r '.clientId' azure-creds.json)
CLIENT_SECRET=$(jq -r '.clientSecret' azure-creds.json)
SUBSCRIPTION_ID=$(jq -r '.subscriptionId' azure-creds.json)
TENANT_ID=$(jq -r '.tenantId' azure-creds.json)

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ] || [ -z "$SUBSCRIPTION_ID" ] || [ -z "$TENANT_ID" ]; then
    echo -e "${RED}Missing required fields in azure-creds.json${NC}"
    echo "Required fields: clientId, clientSecret, subscriptionId, tenantId"
    exit 1
fi

echo -e "${GREEN}JSON validation passed!${NC}"
echo ""
echo "Service Principal Details:"
echo "  Client ID: $CLIENT_ID"
echo "  Subscription ID: $SUBSCRIPTION_ID"
echo "  Tenant ID: $TENANT_ID"
echo "  Client Secret: ****${CLIENT_SECRET: -4}"
echo ""

# Update GitHub secret
echo -e "${YELLOW}Updating GitHub secret AZURE_CREDENTIALS...${NC}"
cat azure-creds.json | gh secret set AZURE_CREDENTIALS --repo Hady-Achkar/funnel-builder-api

echo -e "${GREEN}✓ GitHub secret updated successfully!${NC}"
echo ""

# Test the credentials
echo -e "${YELLOW}Testing Azure login with the credentials...${NC}"
if az login --service-principal \
    --username "$CLIENT_ID" \
    --password "$CLIENT_SECRET" \
    --tenant "$TENANT_ID" 2>/dev/null; then
    echo -e "${GREEN}✓ Azure login successful!${NC}"
    
    # Show current subscription
    CURRENT_SUB=$(az account show --query name -o tsv)
    echo "  Connected to subscription: $CURRENT_SUB"
    
    # Logout
    az logout
else
    echo -e "${RED}✗ Azure login failed. Please verify your credentials.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Commit and push your changes to trigger the workflow"
echo "2. Or manually trigger: gh workflow run deploy-container-app.yml --ref develop"
echo "3. Monitor: gh run watch"
echo ""
echo -e "${YELLOW}Remember to keep azure-creds.json secure and don't commit it!${NC}"
echo "Adding to .gitignore..."

# Add to .gitignore if not already there
if ! grep -q "azure-creds.json" .gitignore 2>/dev/null; then
    echo "azure-creds.json" >> .gitignore
    echo -e "${GREEN}✓ Added azure-creds.json to .gitignore${NC}"
fi