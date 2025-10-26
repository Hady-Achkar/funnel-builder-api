# Azure Container App Secrets Configuration

This guide explains how to configure secrets for Azure Container Apps using the provided script.

## Prerequisites

1. **Azure CLI installed** - [Installation Guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Authenticated with Azure CLI**:
   ```bash
   az login
   ```
3. **Correct Azure subscription selected**:
   ```bash
   az account list --output table
   az account set --subscription "your-subscription-name-or-id"
   ```

## Configuration

### Environment Variables

The script reads from the `.env` file in the project root. Ensure all required secrets are present:

**Sensitive Secrets (stored as Container App secrets):**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `REDIS_PASSWORD` - Redis authentication password
- `REDIS_URL` - Redis connection URL with authentication
- `CF_API_TOKEN` - Cloudflare API token
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Storage connection string
- `SENDGRID_API_KEY` - SendGrid API key
- `MAMOPAY_API_KEY` - MamoPay API key
- `CRON_SECRET_TOKEN` - Secret token for cron jobs

**Non-Sensitive Configuration (stored as environment variables):**
- All other variables from `.env`

## Usage

### Set Secrets for Test Environment

```bash
./scripts/set-azure-secrets.sh test
```

### Set Secrets for Production Environment

```bash
./scripts/set-azure-secrets.sh production
```

## What the Script Does

1. **Validates Prerequisites**
   - Checks if Azure CLI is installed
   - Verifies Azure authentication
   - Confirms `.env` file exists

2. **Reads Configuration**
   - Loads environment variables from `.env`
   - Determines target container app based on environment

3. **Updates Container App**
   - Sets sensitive values as secrets (referenced as `secretref:name`)
   - Sets non-sensitive values as environment variables
   - Applies configuration to the container app

4. **Confirms Deployment**
   - Displays the container app URL
   - Shows recent revisions
   - Confirms successful update

## Container App Names

- **Test Environment**: `digitalsite-api-test`
- **Production Environment**: `digitalsite-api-prod`
- **Resource Group**: `digitalsite-eu-rg`

## Important Notes

⚠️ **Security Considerations:**
- Secrets are stored securely in Azure Container Apps
- Never commit `.env` file to version control
- Secrets are encrypted at rest in Azure
- Use different secrets for test and production

⚠️ **Deployment Impact:**
- The container app will **restart automatically** after updating secrets
- This causes brief downtime (typically <30 seconds)
- Plan updates during maintenance windows for production

## Verifying Configuration

### View Current Environment Variables

```bash
az containerapp show \
  --name digitalsite-api-test \
  --resource-group digitalsite-eu-rg \
  --query properties.template.containers[0].env \
  --output table
```

### View Current Secrets (names only, not values)

```bash
az containerapp show \
  --name digitalsite-api-test \
  --resource-group digitalsite-eu-rg \
  --query properties.configuration.secrets \
  --output table
```

### Check Container App Status

```bash
az containerapp show \
  --name digitalsite-api-test \
  --resource-group digitalsite-eu-rg \
  --query properties.runningStatus \
  --output tsv
```

### View Logs

```bash
az containerapp logs show \
  --name digitalsite-api-test \
  --resource-group digitalsite-eu-rg \
  --follow
```

## Troubleshooting

### Issue: "Not logged in to Azure"
**Solution:**
```bash
az login
az account set --subscription "your-subscription"
```

### Issue: "Resource not found"
**Solution:** Verify the container app exists:
```bash
az containerapp list \
  --resource-group digitalsite-eu-rg \
  --output table
```

### Issue: "Permission denied"
**Solution:** Ensure you have Contributor or Owner role on the resource group:
```bash
az role assignment list \
  --resource-group digitalsite-eu-rg \
  --output table
```

### Issue: Container app not starting after secret update
**Solution:** Check logs for errors:
```bash
az containerapp logs show \
  --name digitalsite-api-test \
  --resource-group digitalsite-eu-rg \
  --tail 100
```

## Manual Secret Update (Alternative Method)

If you need to update a single secret without running the full script:

```bash
# Update a single secret
az containerapp secret set \
  --name digitalsite-api-test \
  --resource-group digitalsite-eu-rg \
  --secrets "jwt-secret=your-new-secret-value"

# Update environment variable to reference the secret
az containerapp update \
  --name digitalsite-api-test \
  --resource-group digitalsite-eu-rg \
  --set-env-vars "JWT_SECRET=secretref:jwt-secret"
```

## GitHub Actions Integration

The GitHub Actions workflow automatically deploys the container app. However, it does NOT automatically update secrets. You must run this script manually after:

1. Initial container app creation
2. Any time secrets change
3. When rotating credentials

## Best Practices

✅ **Do:**
- Rotate secrets regularly (every 90 days recommended)
- Use different credentials for test and production
- Test secret changes in test environment first
- Keep `.env` file in `.gitignore`
- Document any custom environment variables

❌ **Don't:**
- Commit secrets to version control
- Share `.env` file via insecure channels
- Use production secrets in test environment
- Update production secrets without testing first

## Additional Resources

- [Azure Container Apps Documentation](https://learn.microsoft.com/en-us/azure/container-apps/)
- [Managing Secrets in Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/manage-secrets)
- [Azure CLI Container App Commands](https://learn.microsoft.com/en-us/cli/azure/containerapp)
