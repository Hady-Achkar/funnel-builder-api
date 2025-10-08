import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { DeleteDomainService } from "../../services/domain/delete/delete.service";
import { getPrisma } from "../../lib/prisma";
import { $Enums } from "../../generated/prisma-client";
import * as cloudflareCleanup from "../../services/domain/delete/utils/cloudflare-cleanup";

vi.mock("../../lib/prisma");
vi.mock("../../services/domain/delete/utils/cloudflare-cleanup");

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
    cloudflareRecordId: "cloudflare-record-id-123",
    cloudflareHostnameId: null,
    cloudflareZoneId: "test-zone-id",
  };

  const mockCustomDomain = {
    id: domainId,
    hostname: "www.example.com",
    type: $Enums.DomainType.CUSTOM_DOMAIN,
    status: $Enums.DomainStatus.ACTIVE,
    workspaceId: 1,
    cloudflareRecordId: null,
    cloudflareHostnameId: "cloudflare-hostname-id-123",
    cloudflareZoneId: "test-zone-id",
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
      expect(result.details.dnsRecordsDeleted).toBe(true);
      expect(result.details.customHostnameDeleted).toBe(false);
      expect(mockPrisma.domain.delete).toHaveBeenCalledWith({
        where: { id: domainId },
      });
    });

    it("should call deleteARecord with correct parameters", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockSubdomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockSubdomain);

      vi.mocked(cloudflareCleanup.deleteARecord).mockResolvedValue(true);

      await DeleteDomainService.delete(userId, { id: domainId.toString() });

      expect(vi.mocked(cloudflareCleanup.deleteARecord)).toHaveBeenCalledWith(
        mockSubdomain.cloudflareRecordId,
        mockSubdomain.cloudflareZoneId
      );
    });

    it("should still delete from database even if Cloudflare cleanup fails", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockSubdomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockSubdomain);

      vi.mocked(cloudflareCleanup.deleteARecord).mockRejectedValue(
        new Error("Cloudflare API error")
      );

      const result = await DeleteDomainService.delete(userId, {
        id: domainId.toString(),
      });

      expect(result.message).toContain("External service cleanup may have failed");
      expect(result.details.dnsRecordsDeleted).toBe(false);
      expect(mockPrisma.domain.delete).toHaveBeenCalled();
    });

    it("should handle subdomain without cloudflareRecordId", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue({
        ...mockSubdomain,
        cloudflareRecordId: null,
      });
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockSubdomain);

      const result = await DeleteDomainService.delete(userId, {
        id: domainId.toString(),
      });

      expect(result.details.dnsRecordsDeleted).toBe(false);
      expect(vi.mocked(cloudflareCleanup.deleteARecord)).not.toHaveBeenCalled();
      expect(mockPrisma.domain.delete).toHaveBeenCalled();
    });
  });

  describe("Custom Domain Deletion", () => {
    it("should successfully delete custom domain with hostname cleanup", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockCustomDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockCustomDomain);

      vi.mocked(cloudflareCleanup.deleteCustomHostname).mockResolvedValue(true);

      const result = await DeleteDomainService.delete(userId, {
        id: domainId.toString(),
      });

      expect(result.message).toContain("successfully");
      expect(result.details.hostname).toBe(mockCustomDomain.hostname);
      expect(result.details.customHostnameDeleted).toBe(true);
      expect(result.details.dnsRecordsDeleted).toBe(false);
      expect(mockPrisma.domain.delete).toHaveBeenCalledWith({
        where: { id: domainId },
      });
    });

    it("should call deleteCustomHostname with correct parameters", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockCustomDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockCustomDomain);

      vi.mocked(cloudflareCleanup.deleteCustomHostname).mockResolvedValue(true);

      await DeleteDomainService.delete(userId, { id: domainId.toString() });

      expect(vi.mocked(cloudflareCleanup.deleteCustomHostname)).toHaveBeenCalledWith(
        mockCustomDomain.cloudflareHostnameId,
        mockCustomDomain.cloudflareZoneId
      );
    });

    it("should still delete from database even if Cloudflare cleanup fails", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockCustomDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockCustomDomain);

      vi.mocked(cloudflareCleanup.deleteCustomHostname).mockRejectedValue(
        new Error("Cloudflare API error")
      );

      const result = await DeleteDomainService.delete(userId, {
        id: domainId.toString(),
      });

      expect(result.message).toContain("External service cleanup may have failed");
      expect(result.details.customHostnameDeleted).toBe(false);
      expect(mockPrisma.domain.delete).toHaveBeenCalled();
    });

    it("should handle custom domain without cloudflareHostnameId", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue({
        ...mockCustomDomain,
        cloudflareHostnameId: null,
      });
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockCustomDomain);

      const result = await DeleteDomainService.delete(userId, {
        id: domainId.toString(),
      });

      expect(result.details.customHostnameDeleted).toBe(false);
      expect(vi.mocked(cloudflareCleanup.deleteCustomHostname)).not.toHaveBeenCalled();
      expect(mockPrisma.domain.delete).toHaveBeenCalled();
    });
  });

  describe("External Services (Cloudflare)", () => {
    it("should handle Cloudflare timeout error gracefully", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockSubdomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockSubdomain);

      const timeoutError = new Error("timeout");
      (timeoutError as any).code = "ETIMEDOUT";
      vi.mocked(cloudflareCleanup.deleteARecord).mockRejectedValue(timeoutError);

      const result = await DeleteDomainService.delete(userId, {
        id: domainId.toString(),
      });

      expect(result.message).toContain("External service cleanup may have failed");
      expect(mockPrisma.domain.delete).toHaveBeenCalled();
    });

    it("should handle Cloudflare rate limit error gracefully", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockSubdomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockSubdomain);

      const rateLimitError: any = new Error("Rate limit");
      rateLimitError.response = {
        data: {
          errors: [{ message: "Rate limit exceeded" }],
        },
      };
      vi.mocked(cloudflareCleanup.deleteARecord).mockRejectedValue(rateLimitError);

      const result = await DeleteDomainService.delete(userId, {
        id: domainId.toString(),
      });

      expect(result.message).toContain("External service cleanup may have failed");
      expect(mockPrisma.domain.delete).toHaveBeenCalled();
    });

    it("should handle Cloudflare 404 (resource already deleted) gracefully", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockSubdomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockSubdomain);

      const notFoundError: any = new Error("Not found");
      notFoundError.response = {
        status: 404,
        data: {
          errors: [{ message: "Record not found" }],
        },
      };
      vi.mocked(cloudflareCleanup.deleteARecord).mockRejectedValue(notFoundError);

      const result = await DeleteDomainService.delete(userId, {
        id: domainId.toString(),
      });

      // Should still be considered a failure but not throw
      expect(result.details.dnsRecordsDeleted).toBe(false);
      expect(mockPrisma.domain.delete).toHaveBeenCalled();
    });

    it("should log Cloudflare errors for debugging", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockPrisma.domain.findUnique.mockResolvedValue(mockSubdomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockSubdomain);

      vi.mocked(cloudflareCleanup.deleteARecord).mockRejectedValue(
        new Error("Cloudflare API error")
      );

      await DeleteDomainService.delete(userId, { id: domainId.toString() });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Success Cases", () => {
    it("should return complete response with all details", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockSubdomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockSubdomain);

      vi.mocked(cloudflareCleanup.deleteARecord).mockResolvedValue(true);

      const result = await DeleteDomainService.delete(userId, {
        id: domainId.toString(),
      });

      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.details).toBeDefined();
      expect(result.details.hostname).toBe(mockSubdomain.hostname);
      expect(result.details.cloudflareRecordId).toBe(mockSubdomain.cloudflareRecordId);
      expect(result.details.cloudflareHostnameId).toBe(mockSubdomain.cloudflareHostnameId);
      expect(result.details.dnsRecordsDeleted).toBeDefined();
      expect(result.details.customHostnameDeleted).toBeDefined();
    });

    it("should delete domain from database after Cloudflare cleanup", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockSubdomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockSubdomain);

      vi.mocked(cloudflareCleanup.deleteARecord).mockResolvedValue(true);

      await DeleteDomainService.delete(userId, { id: domainId.toString() });

      // Ensure Cloudflare cleanup happens before database deletion
      const deleteARecordCallOrder = vi.mocked(cloudflareCleanup.deleteARecord).mock.invocationCallOrder[0];
      const domainDeleteCallOrder = mockPrisma.domain.delete.mock.invocationCallOrder[0];

      expect(deleteARecordCallOrder).toBeLessThan(domainDeleteCallOrder);
    });

    it("should handle domains without any Cloudflare IDs", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue({
        ...mockSubdomain,
        cloudflareRecordId: null,
        cloudflareHostnameId: null,
      });
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockSubdomain);

      const result = await DeleteDomainService.delete(userId, {
        id: domainId.toString(),
      });

      expect(result.details.dnsRecordsDeleted).toBe(false);
      expect(result.details.customHostnameDeleted).toBe(false);
      expect(mockPrisma.domain.delete).toHaveBeenCalled();
      expect(vi.mocked(cloudflareCleanup.deleteARecord)).not.toHaveBeenCalled();
      expect(vi.mocked(cloudflareCleanup.deleteCustomHostname)).not.toHaveBeenCalled();
    });

    it("should parse string domain ID correctly", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockSubdomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.delete.mockResolvedValue(mockSubdomain);

      vi.mocked(cloudflareCleanup.deleteARecord).mockResolvedValue(true);

      await DeleteDomainService.delete(userId, { id: "123" });

      expect(mockPrisma.domain.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 123 },
        })
      );
    });
  });
});
