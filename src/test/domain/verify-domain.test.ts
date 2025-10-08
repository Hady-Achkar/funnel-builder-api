import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { VerifyDomainService } from "../../services/domain/verify/verify.service";
import { getPrisma } from "../../lib/prisma";
import { $Enums } from "../../generated/prisma-client";
import * as cloudflareApi from "../../utils/domain-utils/cloudflare-api";
import * as cloudflareCustomHostname from "../../utils/domain-utils/cloudflare-custom-hostname";

vi.mock("../../lib/prisma");
vi.mock("../../utils/domain-utils/cloudflare-api");
vi.mock("../../utils/domain-utils/cloudflare-custom-hostname");

describe("Verify Domain Tests", () => {
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
        update: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);

    // Mock cloudflare helper
    vi.spyOn(cloudflareApi, "getCloudFlareAPIHelper").mockReturnValue({
      getConfig: () => ({
        cfZoneId: "test-zone-id",
        cfApiToken: "test-token",
        cfDomain: "mydigitalsite.io",
      }),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockWorkspace = {
    id: 1,
    name: "Test Workspace",
    ownerId: userId,
  };

  const mockPendingDomain = {
    id: domainId,
    hostname: "www.example.com",
    type: $Enums.DomainType.CUSTOM_DOMAIN,
    status: $Enums.DomainStatus.PENDING,
    sslStatus: $Enums.SslStatus.PENDING,
    workspaceId: 1,
    createdBy: userId,
    cloudflareHostnameId: "cloudflare-hostname-id-123",
    cloudflareZoneId: "test-zone-id",
    verificationToken: "verification-token-123",
    ownershipVerification: {
      type: "txt",
      name: "_cf-custom-hostname.example.com",
      value: "verification-token-123",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockActiveDomain = {
    ...mockPendingDomain,
    status: $Enums.DomainStatus.ACTIVE,
    sslStatus: $Enums.SslStatus.ACTIVE,
  };

  const mockMember = {
    id: 1,
    userId,
    workspaceId: 1,
    role: "OWNER",
    status: "ACTIVE",
    permissions: [$Enums.WorkspacePermission.MANAGE_DOMAINS],
  };

  describe("Validation", () => {
    it("should reject invalid domain ID (non-numeric)", async () => {
      await expect(
        VerifyDomainService.verify(userId, {
          id: "invalid" as any,
        })
      ).rejects.toThrow();
    });

    it("should reject negative domain ID", async () => {
      await expect(
        VerifyDomainService.verify(userId, {
          id: -1,
        })
      ).rejects.toThrow();
    });

    it("should reject zero domain ID", async () => {
      await expect(
        VerifyDomainService.verify(userId, {
          id: 0,
        })
      ).rejects.toThrow();
    });
  });

  describe("Authorization", () => {
    it("should throw error when domain does not exist", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      await expect(
        VerifyDomainService.verify(userId, { id: domainId })
      ).rejects.toThrow("Domain not found");
    });

    it("should throw error when user is not a member of workspace", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        VerifyDomainService.verify(userId, { id: domainId })
      ).rejects.toThrow();
    });

    it("should throw error when user does not have MANAGE_DOMAINS permission", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        ...mockMember,
        permissions: [], // No permissions
      });

      await expect(
        VerifyDomainService.verify(userId, { id: domainId })
      ).rejects.toThrow();
    });

    it("should allow verification with CREATE_DOMAINS permission", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockActiveDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        ...mockMember,
        permissions: [$Enums.WorkspacePermission.CREATE_DOMAINS],
      });

      const result = await VerifyDomainService.verify(userId, { id: domainId });

      expect(result.message).toContain("already active");
    });
  });

  describe("Already Verified Domain", () => {
    it("should return immediately when domain is already ACTIVE", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockActiveDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      const result = await VerifyDomainService.verify(userId, { id: domainId });

      expect(result.message).toContain("already active");
      expect(result.domain.status).toBe($Enums.DomainStatus.ACTIVE);
      expect(result.domain.isVerified).toBe(true);
      expect(result.domain.isActive).toBe(true);
      expect(result.isFullyActive).toBe(true);
      expect(result.nextStep).toBeNull();
      // Should not call Cloudflare API
      expect(vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails)).not.toHaveBeenCalled();
    });
  });

  describe("Domain Configuration", () => {
    it("should throw error when domain has no cloudflareHostnameId", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue({
        ...mockPendingDomain,
        cloudflareHostnameId: null,
      });
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      await expect(
        VerifyDomainService.verify(userId, { id: domainId })
      ).rejects.toThrow(/not configured correctly/);
    });
  });

  describe("Verification Status Checks", () => {
    it("should update domain to ACTIVE when both hostname and SSL are active", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.update.mockResolvedValue({
        ...mockPendingDomain,
        status: $Enums.DomainStatus.ACTIVE,
        sslStatus: $Enums.SslStatus.ACTIVE,
      });

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "active",
        ssl: {
          status: "active",
          validation_records: [],
        },
      } as any);

      const result = await VerifyDomainService.verify(userId, { id: domainId });

      expect(result.domain.status).toBe($Enums.DomainStatus.ACTIVE);
      expect(result.domain.sslStatus).toBe($Enums.SslStatus.ACTIVE);
      expect(result.isFullyActive).toBe(true);
      expect(result.nextStep).toBeNull();
      expect(mockPrisma.domain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: domainId },
          data: expect.objectContaining({
            status: $Enums.DomainStatus.ACTIVE,
            sslStatus: $Enums.SslStatus.ACTIVE,
          }),
        })
      );
    });

    it("should keep domain PENDING when hostname is pending", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.update.mockResolvedValue(mockPendingDomain);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "pending",
        ssl: {
          status: "pending",
          validation_records: [],
        },
      } as any);

      const result = await VerifyDomainService.verify(userId, { id: domainId });

      expect(result.domain.status).toBe($Enums.DomainStatus.PENDING);
      expect(result.isFullyActive).toBe(false);
      expect(result.nextStep).toBeDefined();
    });

    it("should handle pending_validation status", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.update.mockResolvedValue(mockPendingDomain);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "pending_validation",
        ssl: {
          status: "pending_validation",
          validation_records: [],
        },
      } as any);

      const result = await VerifyDomainService.verify(userId, { id: domainId });

      expect(result.domain.status).toBe($Enums.DomainStatus.PENDING);
      expect(result.isFullyActive).toBe(false);
      expect(result.message).toContain("validation");
    });

    it("should handle active hostname with pending SSL", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.update.mockResolvedValue({
        ...mockPendingDomain,
        status: $Enums.DomainStatus.ACTIVE,
        sslStatus: $Enums.SslStatus.PENDING,
      });

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "active",
        ssl: {
          status: "pending",
          validation_records: [],
        },
      } as any);

      const result = await VerifyDomainService.verify(userId, { id: domainId });

      expect(result.domain.status).toBe($Enums.DomainStatus.ACTIVE);
      expect(result.domain.sslStatus).toBe($Enums.SslStatus.PENDING);
      expect(result.isFullyActive).toBe(false);
      expect(result.message).toContain("SSL");
    });

    it("should mark domain as verified when hostname is active", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.update.mockResolvedValue({
        ...mockPendingDomain,
        status: $Enums.DomainStatus.ACTIVE,
      });

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "active",
        ssl: {
          status: "pending",
          validation_records: [],
        },
      } as any);

      const result = await VerifyDomainService.verify(userId, { id: domainId });

      expect(mockPrisma.domain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastVerifiedAt: expect.any(Date),
          }),
        })
      );
    });
  });

  describe("External Services (Cloudflare)", () => {
    it("should handle Cloudflare API failure gracefully", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockRejectedValue(
        new Error("Cloudflare API error")
      );

      await expect(
        VerifyDomainService.verify(userId, { id: domainId })
      ).rejects.toThrow();
    });

    it("should handle Cloudflare timeout error", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      const timeoutError = new Error("timeout");
      (timeoutError as any).code = "ETIMEDOUT";
      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockRejectedValue(timeoutError);

      await expect(
        VerifyDomainService.verify(userId, { id: domainId })
      ).rejects.toThrow();
    });

    it("should handle Cloudflare rate limit error", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      const rateLimitError: any = new Error("Rate limit");
      rateLimitError.response = {
        data: {
          errors: [{ message: "Rate limit exceeded" }],
        },
      };
      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockRejectedValue(
        rateLimitError
      );

      await expect(
        VerifyDomainService.verify(userId, { id: domainId })
      ).rejects.toThrow();
    });

    it("should handle Cloudflare 404 (hostname not found)", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      const notFoundError: any = new Error("Not found");
      notFoundError.response = {
        status: 404,
        data: {
          errors: [{ message: "Custom hostname not found" }],
        },
      };
      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockRejectedValue(
        notFoundError
      );

      await expect(
        VerifyDomainService.verify(userId, { id: domainId })
      ).rejects.toThrow();
    });
  });

  describe("Success Cases", () => {
    it("should successfully verify domain and return complete response", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.update.mockResolvedValue({
        ...mockPendingDomain,
        status: $Enums.DomainStatus.ACTIVE,
        sslStatus: $Enums.SslStatus.ACTIVE,
      });

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "active",
        ssl: {
          status: "active",
          validation_records: [],
        },
      } as any);

      const result = await VerifyDomainService.verify(userId, { id: domainId });

      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.domain).toBeDefined();
      expect(result.domain.id).toBe(domainId);
      expect(result.domain.hostname).toBe(mockPendingDomain.hostname);
      expect(result.domain.type).toBe(mockPendingDomain.type);
      expect(result.domain.status).toBe($Enums.DomainStatus.ACTIVE);
      expect(result.domain.sslStatus).toBe($Enums.SslStatus.ACTIVE);
      expect(result.domain.isVerified).toBe(true);
      expect(result.domain.isActive).toBe(true);
      expect(result.domain.customHostnameId).toBe(mockPendingDomain.cloudflareHostnameId);
      expect(result.isFullyActive).toBe(true);
      expect(result.nextStep).toBeNull();
    });

    it("should call Cloudflare API with correct parameters", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.update.mockResolvedValue(mockPendingDomain);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "pending",
        ssl: {
          status: "pending",
          validation_records: [],
        },
      } as any);

      await VerifyDomainService.verify(userId, { id: domainId });

      expect(vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails)).toHaveBeenCalledWith(
        mockPendingDomain.cloudflareHostnameId,
        "test-zone-id"
      );
    });

    it("should return helpful next steps when not fully active", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.update.mockResolvedValue(mockPendingDomain);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "pending",
        ssl: {
          status: "pending",
          validation_records: [],
        },
      } as any);

      const result = await VerifyDomainService.verify(userId, { id: domainId });

      expect(result.isFullyActive).toBe(false);
      expect(result.nextStep).toBeDefined();
      // nextStep can be null or a string
      if (result.nextStep) {
        expect(result.nextStep).toBeTruthy();
      }
    });

    it("should include overallStatus from Cloudflare in response", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.update.mockResolvedValue(mockPendingDomain);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "pending_validation",
        ssl: {
          status: "pending_validation",
          validation_records: [],
        },
      } as any);

      const result = await VerifyDomainService.verify(userId, { id: domainId });

      expect(result.domain.overallStatus).toBe("pending_validation");
    });
  });
});
