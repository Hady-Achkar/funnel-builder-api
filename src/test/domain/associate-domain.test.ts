import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AssociateDomainService } from "../../services/domain/associate";
import { getPrisma } from "../../lib/prisma";
import { DomainType, DomainStatus, SslStatus } from "../../generated/prisma-client";

// Mock dependencies
vi.mock("../../lib/prisma");
vi.mock("../../utils/domain-utils/azure-frontdoor-custom-domain", () => ({
  getAzureFrontDoorCustomDomainDetails: vi.fn(),
  associateCustomDomainWithRoute: vi.fn(),
}));
vi.mock("../../utils/domain-utils/azure-frontdoor-api", () => ({
  getAzureFrontDoorConfig: vi.fn(() => ({
    resourceGroup: "test-rg",
    profileName: "test-profile",
    endpointName: "test-endpoint",
    frontDoorEndpointUrl: "test.azurefd.net",
  })),
  getAzureCdnClient: vi.fn(() => ({
    routes: {
      get: vi.fn(),
    },
  })),
}));
vi.mock("../../utils/workspace-utils/workspace-permission-manager", () => ({
  PermissionManager: {
    requirePermission: vi.fn(),
  },
  PermissionAction: {
    MANAGE_DOMAIN: "MANAGE_DOMAIN",
  },
}));

import {
  getAzureFrontDoorCustomDomainDetails,
  associateCustomDomainWithRoute,
} from "../../utils/domain-utils/azure-frontdoor-custom-domain";
import { getAzureCdnClient } from "../../utils/domain-utils/azure-frontdoor-api";
import { PermissionManager } from "../../utils/workspace-utils/workspace-permission-manager";

describe("Associate Domain Service Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const domainId = 1;
  const workspaceId = 1;
  const routeName = "default-route";

  const mockDomain = {
    id: domainId,
    hostname: "example.com",
    type: DomainType.CUSTOM_DOMAIN,
    status: DomainStatus.VERIFIED,
    sslStatus: SslStatus.ACTIVE,
    workspaceId: workspaceId,
    azureCustomDomainName: "example-com",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAzureDetails = {
    id: "/subscriptions/test/resourceGroups/test-rg/providers/Microsoft.Cdn/profiles/test-profile/customDomains/example-com",
    name: "example-com",
    hostName: "example.com",
    validationProperties: {
      validationToken: "test-token",
    },
    domainValidationState: "Approved",
    tlsSettings: {
      certificateType: "ManagedCertificate",
      minimumTlsVersion: "TLS12",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      domain: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
    (PermissionManager.requirePermission as any).mockResolvedValue(undefined);
    (getAzureFrontDoorCustomDomainDetails as any).mockResolvedValue(mockAzureDetails);
    (associateCustomDomainWithRoute as any).mockResolvedValue(undefined);

    const mockClient = getAzureCdnClient();
    (mockClient.routes.get as any).mockResolvedValue({
      id: "/subscriptions/test/resourceGroups/test-rg/providers/Microsoft.Cdn/profiles/test-profile/afdEndpoints/test-endpoint/routes/default-route",
      name: routeName,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation", () => {
    it("should throw error if domain ID is invalid (negative)", async () => {
      await expect(
        AssociateDomainService.associate(userId, { id: -1, routeName })
      ).rejects.toThrow("Domain ID must be a positive number");
    });

    it("should throw error if domain ID is invalid (zero)", async () => {
      await expect(
        AssociateDomainService.associate(userId, { id: 0, routeName })
      ).rejects.toThrow("Domain ID must be a positive number");
    });

    it("should throw error if domain ID is not a number", async () => {
      await expect(
        AssociateDomainService.associate(userId, { id: "invalid", routeName })
      ).rejects.toThrow("Domain ID must be a valid number");
    });

    it("should throw error if domain does not exist", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      await expect(
        AssociateDomainService.associate(userId, { id: domainId, routeName })
      ).rejects.toThrow("Domain not found");
    });

    it("should throw error if trying to associate a subdomain", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue({
        ...mockDomain,
        type: DomainType.SUBDOMAIN,
      });

      await expect(
        AssociateDomainService.associate(userId, { id: domainId, routeName })
      ).rejects.toThrow("Subdomains (*.digitalsite.io) are automatically routed");
    });

    it("should throw error if domain is not associated with workspace", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue({
        ...mockDomain,
        workspaceId: null,
      });

      await expect(
        AssociateDomainService.associate(userId, { id: domainId, routeName })
      ).rejects.toThrow("Domain is not associated with a workspace");
    });

    it("should throw error if domain status is PENDING", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue({
        ...mockDomain,
        status: DomainStatus.PENDING,
      });

      await expect(
        AssociateDomainService.associate(userId, { id: domainId, routeName })
      ).rejects.toThrow("Domain must be verified before association");
    });

    it("should throw error if domain status is FAILED", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue({
        ...mockDomain,
        status: DomainStatus.FAILED,
      });

      await expect(
        AssociateDomainService.associate(userId, { id: domainId, routeName })
      ).rejects.toThrow("Domain must be verified before association");
    });

    it("should throw error if Azure custom domain name is missing", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue({
        ...mockDomain,
        azureCustomDomainName: null,
      });

      await expect(
        AssociateDomainService.associate(userId, { id: domainId, routeName })
      ).rejects.toThrow("Domain configuration is incomplete");
    });
  });

  describe("Permission Checks", () => {
    beforeEach(() => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
    });

    it("should allow user with MANAGE_DOMAIN permission", async () => {
      mockPrisma.domain.update.mockResolvedValue({
        ...mockDomain,
        status: DomainStatus.ACTIVE,
      });

      await AssociateDomainService.associate(userId, { id: domainId, routeName });

      expect(PermissionManager.requirePermission).toHaveBeenCalledWith({
        userId,
        workspaceId,
        action: "MANAGE_DOMAIN",
      });
    });

    it("should deny user without MANAGE_DOMAIN permission", async () => {
      (PermissionManager.requirePermission as any).mockRejectedValue(
        new Error("You don't have permission to manage domains")
      );

      await expect(
        AssociateDomainService.associate(userId, { id: domainId, routeName })
      ).rejects.toThrow("You don't have permission to manage domains");
    });
  });

  describe("Azure Integration", () => {
    beforeEach(() => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.domain.update.mockResolvedValue({
        ...mockDomain,
        status: DomainStatus.ACTIVE,
      });
    });

    it("should throw error if Azure domain details fetch fails", async () => {
      (getAzureFrontDoorCustomDomainDetails as any).mockRejectedValue(
        new Error("Azure API error")
      );

      await expect(
        AssociateDomainService.associate(userId, { id: domainId, routeName })
      ).rejects.toThrow("Unable to retrieve domain information at this time");
    });

    it("should throw error if domain is not approved in Azure", async () => {
      (getAzureFrontDoorCustomDomainDetails as any).mockResolvedValue({
        ...mockAzureDetails,
        domainValidationState: "Pending",
      });

      await expect(
        AssociateDomainService.associate(userId, { id: domainId, routeName })
      ).rejects.toThrow("Domain validation is not yet complete");
    });

    it("should throw error if domain is rejected in Azure", async () => {
      (getAzureFrontDoorCustomDomainDetails as any).mockResolvedValue({
        ...mockAzureDetails,
        domainValidationState: "Rejected",
      });

      await expect(
        AssociateDomainService.associate(userId, { id: domainId, routeName })
      ).rejects.toThrow("Domain validation is not yet complete");
    });

    it("should throw error if Azure association fails", async () => {
      (associateCustomDomainWithRoute as any).mockRejectedValue(
        new Error("Azure association failed")
      );

      await expect(
        AssociateDomainService.associate(userId, { id: domainId, routeName })
      ).rejects.toThrow("We couldn't activate your domain at this time");
    });

    it("should handle already associated domains as success (idempotent)", async () => {
      (associateCustomDomainWithRoute as any).mockRejectedValue(
        new Error("Domain already associated with route")
      );

      const result = await AssociateDomainService.associate(userId, { id: domainId, routeName });

      expect(result.message).toContain("Success!");
      expect(result.domain.isAssociated).toBe(true);
    });
  });

  describe("Successful Association", () => {
    beforeEach(() => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.domain.update.mockResolvedValue({
        ...mockDomain,
        status: DomainStatus.ACTIVE,
        lastVerifiedAt: new Date(),
      });
    });

    it("should successfully associate domain with default route", async () => {
      const result = await AssociateDomainService.associate(userId, {
        id: domainId,
        routeName: "default-route",
      });

      expect(result.message).toContain("Success!");
      expect(result.domain.id).toBe(domainId);
      expect(result.domain.hostname).toBe("example.com");
      expect(result.domain.status).toBe(DomainStatus.ACTIVE);
      expect(result.domain.isAssociated).toBe(true);
      expect(result.azureDetails.customDomainName).toBe("example-com");
      expect(result.azureDetails.routeName).toBe("default-route");
    });

    it("should use default route name if not provided", async () => {
      const result = await AssociateDomainService.associate(userId, {
        id: domainId,
      });

      expect(result.azureDetails.routeName).toBe("default-route");
    });

    it("should call associateCustomDomainWithRoute with correct parameters", async () => {
      await AssociateDomainService.associate(userId, {
        id: domainId,
        routeName: "custom-route",
      });

      expect(associateCustomDomainWithRoute).toHaveBeenCalledWith(
        "example-com",
        "custom-route"
      );
    });

    it("should update domain status to ACTIVE", async () => {
      await AssociateDomainService.associate(userId, { id: domainId, routeName });

      expect(mockPrisma.domain.update).toHaveBeenCalledWith({
        where: { id: domainId },
        data: {
          status: DomainStatus.ACTIVE,
          lastVerifiedAt: expect.any(Date),
        },
      });
    });

    it("should return Azure details in response", async () => {
      const result = await AssociateDomainService.associate(userId, { id: domainId, routeName });

      expect(result.azureDetails).toHaveProperty("customDomainId");
      expect(result.azureDetails).toHaveProperty("customDomainName");
      expect(result.azureDetails).toHaveProperty("routeId");
      expect(result.azureDetails).toHaveProperty("routeName");
      expect(result.azureDetails).toHaveProperty("associatedAt");
    });

    it("should work with VERIFIED status domains", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue({
        ...mockDomain,
        status: DomainStatus.VERIFIED,
      });

      const result = await AssociateDomainService.associate(userId, { id: domainId, routeName });

      expect(result.message).toContain("Success!");
      expect(result.domain.isAssociated).toBe(true);
    });

    it("should work with ACTIVE status domains (re-association)", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue({
        ...mockDomain,
        status: DomainStatus.ACTIVE,
      });

      const result = await AssociateDomainService.associate(userId, { id: domainId, routeName });

      expect(result.message).toContain("Success!");
      expect(result.domain.isAssociated).toBe(true);
    });
  });

  describe("Response Format", () => {
    beforeEach(() => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockDomain);
      mockPrisma.domain.update.mockResolvedValue({
        ...mockDomain,
        status: DomainStatus.ACTIVE,
      });
    });

    it("should return correct response structure", async () => {
      const result = await AssociateDomainService.associate(userId, { id: domainId, routeName });

      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("domain");
      expect(result).toHaveProperty("azureDetails");
      expect(typeof result.message).toBe("string");
      expect(typeof result.domain).toBe("object");
      expect(typeof result.azureDetails).toBe("object");
    });

    it("should include all required domain fields", async () => {
      const result = await AssociateDomainService.associate(userId, { id: domainId, routeName });

      expect(result.domain).toHaveProperty("id");
      expect(result.domain).toHaveProperty("hostname");
      expect(result.domain).toHaveProperty("type");
      expect(result.domain).toHaveProperty("status");
      expect(result.domain).toHaveProperty("sslStatus");
      expect(result.domain).toHaveProperty("isAssociated");
      expect(result.domain).toHaveProperty("azureCustomDomainName");
      expect(result.domain).toHaveProperty("createdAt");
      expect(result.domain).toHaveProperty("updatedAt");
    });

    it("should include all required Azure details fields", async () => {
      const result = await AssociateDomainService.associate(userId, { id: domainId, routeName });

      expect(result.azureDetails).toHaveProperty("customDomainId");
      expect(result.azureDetails).toHaveProperty("customDomainName");
      expect(result.azureDetails).toHaveProperty("routeId");
      expect(result.azureDetails).toHaveProperty("routeName");
      expect(result.azureDetails).toHaveProperty("associatedAt");
    });
  });
});
