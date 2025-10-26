import { CdnManagementClient } from "@azure/arm-cdn";
import { DefaultAzureCredential, ClientSecretCredential } from "@azure/identity";

/**
 * Azure Front Door Configuration
 */
export interface AzureFrontDoorConfig {
  subscriptionId: string;
  resourceGroup: string;
  profileName: string;
  endpointName: string;
  frontDoorEndpointUrl: string; // e.g., digitalsite-endpoint-xxx.z02.azurefd.net
}

/**
 * Get Azure Front Door configuration from environment variables
 */
export function getAzureFrontDoorConfig(): AzureFrontDoorConfig {
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
  const resourceGroup = process.env.AZURE_RESOURCE_GROUP;
  const profileName = process.env.AZURE_FRONTDOOR_PROFILE_NAME;
  const endpointName = process.env.AZURE_FRONTDOOR_ENDPOINT_NAME;
  const frontDoorEndpointUrl = process.env.AZURE_FRONTDOOR_ENDPOINT_URL;

  if (!subscriptionId) {
    throw new Error("AZURE_SUBSCRIPTION_ID is not configured");
  }
  if (!resourceGroup) {
    throw new Error("AZURE_RESOURCE_GROUP is not configured");
  }
  if (!profileName) {
    throw new Error("AZURE_FRONTDOOR_PROFILE_NAME is not configured");
  }
  if (!endpointName) {
    throw new Error("AZURE_FRONTDOOR_ENDPOINT_NAME is not configured");
  }
  if (!frontDoorEndpointUrl) {
    throw new Error("AZURE_FRONTDOOR_ENDPOINT_URL is not configured");
  }

  return {
    subscriptionId,
    resourceGroup,
    profileName,
    endpointName,
    frontDoorEndpointUrl,
  };
}

/**
 * Get Azure credential for authentication
 */
export function getAzureCredential() {
  // Check if using Service Principal credentials
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (tenantId && clientId && clientSecret) {
    return new ClientSecretCredential(tenantId, clientId, clientSecret);
  }

  // Fall back to DefaultAzureCredential (works with Managed Identity, Azure CLI, etc.)
  return new DefaultAzureCredential();
}

/**
 * Get Azure CDN Management Client
 */
export function getAzureCdnClient(): CdnManagementClient {
  const config = getAzureFrontDoorConfig();
  const credential = getAzureCredential();

  return new CdnManagementClient(credential, config.subscriptionId);
}

/**
 * Sanitize hostname for Azure resource naming
 * Azure resource names can only contain alphanumeric characters and hyphens
 */
export function sanitizeHostnameForAzure(hostname: string): string {
  return hostname.replace(/\./g, "-").toLowerCase();
}

/**
 * Get Azure Front Door API helper with all utilities
 */
export function getAzureFrontDoorAPIHelper() {
  return {
    getConfig: getAzureFrontDoorConfig,
    getClient: getAzureCdnClient,
    getCredential: getAzureCredential,
    sanitizeHostname: sanitizeHostnameForAzure,
  };
}
