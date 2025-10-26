import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { DeleteDomainService } from "../../services/domain/delete/delete.service";
import { getPrisma } from "../../lib/prisma";
import { $Enums } from "../../generated/prisma-client";
import * as cloudflareCleanup from "../../services/domain/delete/utils/cloudflare-cleanup";
import * as azureFrontDoor from "../../utils/domain-utils/azure-frontdoor-custom-domain";

vi.mock("../../lib/prisma");
vi.mock("../../services/domain/delete/utils/cloudflare-cleanup");
vi.mock("../../utils/domain-utils/azure-frontdoor-custom-domain");

describe("Delete Domain Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const domainId = 1;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      workspace: {
        findUnique: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
      },
      domain: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockWorkspace = {
    id: 1,
    name: "Test Workspace",
    ownerId: userId,
  };

  const mockSubdomain = {
    id: domainId,
    hostname: "test.mydigitalsite.io",
    type: $Enums.DomainType.SUBDOMAIN,
    status: $Enums.DomainStatus.ACTIVE,
    workspaceId: 1,
  };

  const mockCustomDomain = {
    id: domainId,
    hostname: "www.example.com",
    type: $Enums.DomainType.CUSTOM_DOMAIN,
    status: $Enums.DomainStatus.ACTIVE,
    workspaceId: 1,
  };

  const mockMember = {
    id: 1,
    userId,
    workspaceId: 1,
    role: "OWNER",
    status: "ACTIVE",
    permissions: [$Enums.WorkspacePermission.DELETE_DOMAINS],
  };

  describe("Validation", () => {
    it("should reject invalid domain ID (non-numeric)", async () => {
      await expect(
        DeleteDomainService.delete(userId, { id: "invalid" })
      ).rejects.toThrow(/Invalid domain ID/);
    });

    it("should reject negative domain ID", async () => {
      await expect(
        DeleteDomainService.delete(userId, { id: "-1" })
      ).rejects.toThrow(/Invalid domain ID/);
    });

    it("should reject zero domain ID", async () => {
      await expect(
        DeleteDomainService.delete(userId, { id: "0" })
      ).rejects.toThrow(/Invalid domain ID/);
    });

    it("should reject NaN domain ID", async () => {
      await expect(
        DeleteDomainService.delete(userId, { id: "abc123" })
      ).rejects.toThrow(/Invalid domain ID/);
    });
  });

  describe("Authorization", () => {
    it("should throw error when domain does not exist", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      await expect(
        DeleteDomainService.delete(userId, { id: domainId.toString() })
      ).rejects.toThrow(/not found/);
    });

    it("should throw error when user is not a member of workspace", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockSubdomain);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        DeleteDomainService.delete(userId, { id: domainId.toString() })
      ).rejects.toThrow();
    });

    it("should throw error when user does not have DELETE_DOMAINS permission", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockSubdomain);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        ...mockMember,
        permissions: [], // No permissions
      });

      await expect(
        DeleteDomainService.delete(userId, { id: domainId.toString() })
      ).rejects.toThrow();
    });
  });

  describe("Subdomain Deletion", () => {
    it("should successfully delete subdomain with A record cleanup", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockSubdomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockSubdomain);

      vi.mocked(cloudflareCleanup.deleteARecord).mockResolvedValue(true);

      const result = await DeleteDomainService.delete(userId, {
        id: domainId.toString(),
      });

      expect(result.message).toContain("successfully");
      expect(result.details.hostname).toBe(mockSubdomain.hostname);
      expect(result.details.azureDeleted).toBeDefined();
      expect(result.details.type).toBe(mockSubdomain.type);
      expect(mockPrisma.domain.delete).toHaveBeenCalledWith({
        where: { id: domainId },
      });
    });

    it("should successfully delete subdomain from database", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue({
        ...mockSubdomain,
      });
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockSubdomain);

      const result = await DeleteDomainService.delete(userId, {
        id: domainId.toString(),
      });

      expect(result.details.azureDeleted).toBeDefined();
      expect(mockPrisma.domain.delete).toHaveBeenCalled();
    });
  });

  describe("Custom Domain Deletion", () => {
    it("should successfully delete custom domain with Azure cleanup", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue({
        ...mockCustomDomain,
        azureCustomDomainName: "www-example-com",
      });
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockCustomDomain);

      vi.mocked(azureFrontDoor.deleteAzureFrontDoorCustomDomain).mockResolvedValue();

      const result = await DeleteDomainService.delete(userId, {
        id: domainId.toString(),
      });

      expect(result.message).toContain("successfully");
      expect(result.details.hostname).toBe(mockCustomDomain.hostname);
      expect(result.details.azureDeleted).toBe(true);
      expect(result.details.type).toBe(mockCustomDomain.type);
      expect(mockPrisma.domain.delete).toHaveBeenCalledWith({
        where: { id: domainId },
      });
    });

    it("should handle Azure deletion failure gracefully", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue({
        ...mockCustomDomain,
        azureCustomDomainName: "www-example-com",
      });
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockCustomDomain);

      vi.mocked(azureFrontDoor.deleteAzureFrontDoorCustomDomain).mockRejectedValue(
        new Error("Azure API error")
      );

      const result = await DeleteDomainService.delete(userId, {
        id: domainId.toString(),
      });

      expect(result.message).toContain("Azure deletion may have failed");
      expect(result.details.azureDeleted).toBe(false);
      expect(mockPrisma.domain.delete).toHaveBeenCalled();
    });
  });

  describe("Success Cases", () => {
    it("should return complete response with all details", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockSubdomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockSubdomain);

      const result = await DeleteDomainService.delete(userId, {
        id: domainId.toString(),
      });

      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.details).toBeDefined();
      expect(result.details.hostname).toBe(mockSubdomain.hostname);
      expect(result.details.azureDeleted).toBeDefined();
      expect(result.details.type).toBeDefined();
    });

    it("should parse string domain ID correctly", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockSubdomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockSubdomain);

      await DeleteDomainService.delete(userId, { id: "123" });

      expect(mockPrisma.domain.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 123 },
        })
      );
    });
  });
});
