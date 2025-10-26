import { getAzureCdnClient, getAzureFrontDoorConfig, sanitizeHostnameForAzure } from "../azure-frontdoor-api";
import { AFDDomain, AFDDomainHttpsParameters } from "@azure/arm-cdn";

/**
 * Azure Front Door custom domain response
 */
export interface AzureFrontDoorCustomDomain {
  id: string;
  name: string;
  hostName: string;
  validationProperties: {
    validationToken: string;
    expirationDate?: string;
  };
  domainValidationState: string;
  tlsSettings?: {
    certificateType: string;
    minimumTlsVersion: string;
  };
}

/**
 * Create a custom domain in Azure Front Door
 */
export async function createAzureFrontDoorCustomDomain(
  hostname: string
): Promise<AzureFrontDoorCustomDomain> {
  const client = getAzureCdnClient();
  const config = getAzureFrontDoorConfig();
  const customDomainName = sanitizeHostnameForAzure(hostname);

  const customDomainParameters: AFDDomain = {
    hostName: hostname,
    tlsSettings: {
      certificateType: "ManagedCertificate",
      minimumTlsVersion: "TLS12",
    } as AFDDomainHttpsParameters,
  };

  try {
    const result = await client.afdCustomDomains.beginCreateAndWait(
      config.resourceGroup,
      config.profileName,
      customDomainName,
      customDomainParameters
    );

    return {
      id: result.id || "",
      name: result.name || "",
      hostName: result.hostName || hostname,
      validationProperties: {
        validationToken: result.validationProperties?.validationToken || "",
        expirationDate: result.validationProperties?.expirationDate || undefined,
      },
      domainValidationState: result.domainValidationState || "Pending",
      tlsSettings: {
        certificateType: result.tlsSettings?.certificateType || "ManagedCertificate",
        minimumTlsVersion: result.tlsSettings?.minimumTlsVersion || "TLS12",
      },
    };
  } catch (error: any) {
    console.error("[Azure Front Door] Create custom domain error:", error);
    throw new Error(`Failed to create custom domain in Azure Front Door: ${error.message}`);
  }
}

/**
 * Get custom domain details from Azure Front Door
 */
export async function getAzureFrontDoorCustomDomainDetails(
  customDomainName: string
): Promise<AzureFrontDoorCustomDomain> {
  const client = getAzureCdnClient();
  const config = getAzureFrontDoorConfig();

  try {
    const result = await client.afdCustomDomains.get(
      config.resourceGroup,
      config.profileName,
      customDomainName
    );

    return {
      id: result.id || "",
      name: result.name || "",
      hostName: result.hostName || "",
      validationProperties: {
        validationToken: result.validationProperties?.validationToken || "",
        expirationDate: result.validationProperties?.expirationDate || undefined,
      },
      domainValidationState: result.domainValidationState || "Pending",
      tlsSettings: {
        certificateType: result.tlsSettings?.certificateType || "ManagedCertificate",
        minimumTlsVersion: result.tlsSettings?.minimumTlsVersion || "TLS12",
      },
    };
  } catch (error: any) {
    console.error("[Azure Front Door] Get custom domain error:", error);
    throw new Error(`Failed to get custom domain from Azure Front Door: ${error.message}`);
  }
}

/**
 * Trigger validation for a custom domain
 * This is done by calling refreshValidationToken
 */
export async function validateAzureFrontDoorCustomDomain(
  customDomainName: string
): Promise<void> {
  const client = getAzureCdnClient();
  const config = getAzureFrontDoorConfig();

  try {
    await client.afdCustomDomains.beginRefreshValidationTokenAndWait(
      config.resourceGroup,
      config.profileName,
      customDomainName
    );
  } catch (error: any) {
    console.error("[Azure Front Door] Validate custom domain error:", error);
    throw new Error(`Failed to validate custom domain in Azure Front Door: ${error.message}`);
  }
}

/**
 * Associate custom domain with Azure Front Door route
 */
export async function associateCustomDomainWithRoute(
  customDomainName: string,
  routeName: string = "default-route"
): Promise<void> {
  const client = getAzureCdnClient();
  const config = getAzureFrontDoorConfig();

  try {
    // Get the current route configuration
    const route = await client.routes.get(
      config.resourceGroup,
      config.profileName,
      config.endpointName,
      routeName
    );

    // Get the custom domain resource ID
    const customDomain = await client.afdCustomDomains.get(
      config.resourceGroup,
      config.profileName,
      customDomainName
    );

    // Add the custom domain to the route's customDomains array
    const customDomains = route.customDomains || [];
    const customDomainId = customDomain.id;

    if (customDomainId && !customDomains.some((d) => d.id === customDomainId)) {
      customDomains.push({ id: customDomainId });

      // Update the route with the new custom domain
      await client.routes.beginUpdateAndWait(
        config.resourceGroup,
        config.profileName,
        config.endpointName,
        routeName,
        {
          ...route,
          customDomains,
        }
      );
    }
  } catch (error: any) {
    console.error("[Azure Front Door] Associate custom domain error:", error);
    throw new Error(`Failed to associate custom domain with route: ${error.message}`);
  }
}

/**
 * Delete custom domain from Azure Front Door
 */
export async function deleteAzureFrontDoorCustomDomain(
  customDomainName: string
): Promise<void> {
  const client = getAzureCdnClient();
  const config = getAzureFrontDoorConfig();

  try {
    await client.afdCustomDomains.beginDeleteAndWait(
      config.resourceGroup,
      config.profileName,
      customDomainName
    );
  } catch (error: any) {
    console.error("[Azure Front Door] Delete custom domain error:", error);
    throw new Error(`Failed to delete custom domain from Azure Front Door: ${error.message}`);
  }
}

/**
 * List all custom domains in Azure Front Door
 */
export async function listAzureFrontDoorCustomDomains(): Promise<AzureFrontDoorCustomDomain[]> {
  const client = getAzureCdnClient();
  const config = getAzureFrontDoorConfig();

  try {
    const domains: AzureFrontDoorCustomDomain[] = [];
    const iterator = client.afdCustomDomains.listByProfile(
      config.resourceGroup,
      config.profileName
    );

    for await (const domain of iterator) {
      domains.push({
        id: domain.id || "",
        name: domain.name || "",
        hostName: domain.hostName || "",
        validationProperties: {
          validationToken: domain.validationProperties?.validationToken || "",
          expirationDate: domain.validationProperties?.expirationDate || undefined,
        },
        domainValidationState: domain.domainValidationState || "Pending",
        tlsSettings: {
          certificateType: domain.tlsSettings?.certificateType || "ManagedCertificate",
          minimumTlsVersion: domain.tlsSettings?.minimumTlsVersion || "TLS12",
        },
      });
    }

    return domains;
  } catch (error: any) {
    console.error("[Azure Front Door] List custom domains error:", error);
    throw new Error(`Failed to list custom domains from Azure Front Door: ${error.message}`);
  }
}
