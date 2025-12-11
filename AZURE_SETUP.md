# Azure Container Apps Setup Guide

## Prerequisites

Before deploying to Azure Container Apps, you need to:

1. **Create Azure Service Principal** (requires Azure AD permissions)
2. **Configure GitHub Secrets**
3. **Create Azure Resources**

## Step 1: Create Azure Service Principal

You need an Azure account with permissions to create service principals. Run this command:

```bash
az ad sp create-for-rbac \
  --name "digitalsite-container-apps-sp" \
  --role contributor \
  --scopes /subscriptions/93dc0ddb-48f8-4a4f-abe0-81314b665856 \
  --output json
```

This will output JSON like:

```json
{
  "appId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "displayName": "digitalsite-container-apps-sp",
  "password": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenant": "560080a9-15de-402a-9e11-2a469737ca1e"
}
```

## Step 2: Format AZURE_CREDENTIALS

Create the AZURE_CREDENTIALS JSON using the output from above:

```json
{
  "clientId": "<appId from above>",
  "clientSecret": "<password from above>",
  "subscriptionId": "93dc0ddb-48f8-4a4f-abe0-81314b665856",
  "tenantId": "560080a9-15de-402a-9e11-2a469737ca1e"
}
```

## Step 3: Update GitHub Secret

Update the AZURE_CREDENTIALS secret:

```bash
# Save the JSON to a file
cat > azure-creds.json << 'EOF'
{
  "clientId": "YOUR_APP_ID",
  "clientSecret": "YOUR_PASSWORD",
  "subscriptionId": "93dc0ddb-48f8-4a4f-abe0-81314b665856",
  "tenantId": "560080a9-15de-402a-9e11-2a469737ca1e"
}
EOF

# Update the secret
cat azure-creds.json | gh secret set AZURE_CREDENTIALS --repo Hady-Achkar/funnel-builder-api

# Clean up
rm azure-creds.json
```

## Step 4: Update Database Password

Update the DATABASE_URL secret with the actual password:

```bash
# Get the password for your PostgreSQL server
DATABASE_URL="postgresql://dsdbadminpostgresmain:YOUR_ACTUAL_PASSWORD@digitalsite-postgress-server-main.postgres.database.azure.com:5432/digitalsite_production_v2?sslmode=require"

echo "$DATABASE_URL" | gh secret set DATABASE_URL --repo Hady-Achkar/funnel-builder-api
echo "$DATABASE_URL" | gh secret set STAGING_DATABASE_URL --repo Hady-Achkar/funnel-builder-api
echo "$DATABASE_URL" | gh secret set PRODUCTION_DATABASE_URL --repo Hady-Achkar/funnel-builder-api
```

## Step 5: Create Azure Resources

Run the setup script to create Azure resources:

```bash
cd scripts
./azure-container-app-setup.sh
```

This will create:

- Resource Group: `digitalsite-container-apps-rg`
- Container Registry: `digitalsiteacr`
- Container App Environments (staging and production)
- Log Analytics Workspace
- Redis Cache (if configured)

## Step 6: Update Redis Connection

After the Redis Cache is created, update the REDIS_URL:

```bash
# Get Redis connection details
REDIS_HOST="digitalsite-redis.redis.cache.windows.net"
REDIS_KEY="YOUR_REDIS_PRIMARY_KEY"

REDIS_URL="rediss://:${REDIS_KEY}@${REDIS_HOST}:6380"

echo "$REDIS_URL" | gh secret set REDIS_URL --repo Hady-Achkar/funnel-builder-api
echo "$REDIS_URL" | gh secret set STAGING_REDIS_URL --repo Hady-Achkar/funnel-builder-api
echo "$REDIS_URL" | gh secret set PRODUCTION_REDIS_URL --repo Hady-Achkar/funnel-builder-api
```

## Step 7: Trigger Deployment

Once all secrets are configured, trigger the deployment:

```bash
# Manually trigger the workflow
gh workflow run deploy-container-app.yml --ref develop

# Or push to develop branch
git push origin develop
```

## Monitoring Deployment

Watch the workflow:

```bash
gh run watch
```

## Troubleshooting

### Azure Login Fails

- Ensure AZURE_CREDENTIALS contains valid clientId and clientSecret
- Verify the service principal has contributor role on the subscription

### Container Registry Access

- Ensure the service principal has AcrPush role on the container registry
- Verify the registry name is correct (`digitalsiteacr`)

### Database Connection

- Ensure the database password is correct
- Verify the database server allows connections from Azure services
- Check that `digitalsite_production_v2` database exists

### Resource Not Found

- Run the setup script first to create all required Azure resources
- Verify resource names match in the workflow file

## URLs

After successful deployment:

- **Staging**: https://digitalsite-api-staging.azurecontainerapps.io
- **Production**: https://digitalsite-api-prod.azurecontainerapps.io

## Secrets List

All required secrets that must be configured in GitHub:

- `AZURE_CREDENTIALS` - Service principal credentials (JSON)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT secret key
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Storage connection
- `AZURE_STORAGE_CONTAINER_NAME` - Storage container name
- `STORAGE_URL` - Storage base URL
- `SENDGRID_API_KEY` - SendGrid API key
- `SENDGRID_FROM_EMAIL` - From email address
- `FRONTEND_URL` - Frontend application URL
- `CF_API_TOKEN` - Cloudflare API token
- `CF_ACCOUNT_ID` - Cloudflare account ID
- `CF_SUBDOMAIN` - Cloudflare verification domain
- `CF_SUBDOMAIN` - Main domain
- `CF_ZONE_ID` - Cloudflare zone ID
- `WORKSPACE_DOMAIN` - Workspace domain
- `WORKSPACE_ZONE_ID` - Workspace zone ID
- `WORKSPACE_IP` - Workspace IP address
- `MAMOPAY_API_KEY` - Mamopay API key
- `MAMOPAY_API_URL` - Mamopay API URL
