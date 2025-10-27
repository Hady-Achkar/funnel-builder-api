import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GetDNSInstructionsService } from "../../services/domain/get-dns-instructions/get-dns-instructions.service";
import { getPrisma } from "../../lib/prisma";
import { $Enums } from "../../generated/prisma-client";
import * as cloudflareApi from "../../utils/domain-utils/cloudflare-api";
import * as cloudflareCustomHostname from "../../utils/domain-utils/cloudflare-custom-hostname";

vi.mock("../../lib/prisma");
vi.mock("../../utils/domain-utils/cloudflare-api");
vi.mock("../../utils/domain-utils/cloudflare-custom-hostname");

describe("Get DNS Instructions Tests", () => {
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
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);

    // Mock cloudflare helper
    vi.spyOn(cloudflareApi, "getCloudFlareAPIHelper").mockReturnValue({
      getConfig: () => ({
        cfZoneId: "test-zone-id",
        cfApiToken: "test-token",
        cfDomain: "digitalsite.app",
      }),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockOwnershipVerification = {
    type: "txt",
    name: "_cf-custom-hostname.example.com",
    value: "verification-token-123",
  };

  const mockDnsInstructions = {
    type: "CNAME",
    name: "www",
    value: "fallback.digitalsite.app",
    purpose: "Live Traffic",
  };

  const mockPendingDomain = {
    id: domainId,
    hostname: "www.example.com",
    type: $Enums.DomainType.CUSTOM_DOMAIN,
    status: $Enums.DomainStatus.PENDING,
    sslStatus: $Enums.SslStatus.PENDING,
    workspaceId: 1,
    cloudflareHostnameId: "cloudflare-hostname-id-123",
    cloudflareZoneId: "test-zone-id",
    verificationToken: "verification-token-123",
    ownershipVerification: mockOwnershipVerification,
    dnsInstructions: mockDnsInstructions,
    sslValidationRecords: [
      {
        txt_name: "_acme-challenge.www",
        txt_value: "ssl-token-123",
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockActiveDomain = {
    ...mockPendingDomain,
    status: $Enums.DomainStatus.ACTIVE,
    sslStatus: $Enums.SslStatus.ACTIVE,
  };

  const mockWorkspace = {
    id: 1,
    name: "Test Workspace",
    ownerId: userId,
  };

  const mockWorkspaceOtherOwner = {
    id: 1,
    name: "Test Workspace",
    ownerId: 999, // Different owner for unauthorized tests
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
        GetDNSInstructionsService.getDNSInstructions(userId, {
          id: "invalid" as any,
        })
      ).rejects.toThrow();
    });

    it("should reject negative domain ID", async () => {
      await expect(
        GetDNSInstructionsService.getDNSInstructions(userId, {
          id: -1,
        })
      ).rejects.toThrow();
    });

    it("should reject zero domain ID", async () => {
      await expect(
        GetDNSInstructionsService.getDNSInstructions(userId, {
          id: 0,
        })
      ).rejects.toThrow();
    });
  });

  describe("Authorization", () => {
    it("should throw error when domain does not exist", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(null);

      await expect(
        GetDNSInstructionsService.getDNSInstructions(userId, { id: domainId })
      ).rejects.toThrow("Domain not found");
    });

    it("should throw error when user is not a member of workspace", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspaceOtherOwner);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        GetDNSInstructionsService.getDNSInstructions(userId, { id: domainId })
      ).rejects.toThrow();
    });

    it("should throw error when user does not have MANAGE_DOMAINS permission", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspaceOtherOwner);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        ...mockMember,
        role: "VIEWER",
        permissions: [], // No permissions
      });

      await expect(
        GetDNSInstructionsService.getDNSInstructions(userId, { id: domainId })
      ).rejects.toThrow();
    });

    it("should allow access with CREATE_DOMAINS permission", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        ...mockMember,
        permissions: [$Enums.WorkspacePermission.CREATE_DOMAINS],
      });

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "pending",
        ssl: {
          status: "pending",
          validation_records: [],
        },
      } as any);

      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      expect(result).toBeDefined();
    });
  });

  describe("DNS Records Generation", () => {
    it("should return TXT and CNAME records for pending custom domain", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "pending",
        ssl: {
          status: "pending",
          validation_records: [
            {
              txt_name: "_acme-challenge.www",
              txt_value: "new-ssl-token",
            },
          ],
        },
      } as any);

      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      expect(result.dnsRecords).toBeDefined();

      // Check for ownership (TXT) record
      expect(result.dnsRecords.ownership).toBeDefined();
      expect(result.dnsRecords.ownership?.type).toBe("TXT");
      expect(result.dnsRecords.ownership?.purpose).toContain("Verification");

      // Check for traffic (CNAME) record
      expect(result.dnsRecords.traffic).toBeDefined();
      expect(result.dnsRecords.traffic?.type).toBe("CNAME");
      expect(result.dnsRecords.traffic?.purpose).toContain("Live Traffic");
    });

    it("should include SSL validation records when available", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "pending",
        ssl: {
          status: "pending_validation",
          validation_records: [
            {
              txt_name: "_acme-challenge.www",
              txt_value: "ssl-validation-token",
            },
          ],
        },
      } as any);

      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      // Check SSL validation records
      expect(result.dnsRecords.ssl).toBeDefined();
      expect(result.dnsRecords.ssl?.length).toBeGreaterThan(0);

      const sslRecord = result.dnsRecords.ssl?.[0];
      expect(sslRecord).toBeDefined();
      expect(sslRecord?.type).toBe("TXT");
      expect(sslRecord?.value).toBe("ssl-validation-token");
    });

    it("should return error when Cloudflare fetch fails", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      // Mock Cloudflare to throw error
      const cloudflareError = new Error("Cloudflare API error");
      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockRejectedValue(
        cloudflareError
      );

      // Service now continues without SSL validation records if Cloudflare fails
      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      // Should return DNS instructions even if Cloudflare fetch fails
      expect(result).toHaveProperty("dnsRecords");
      expect(result).toHaveProperty("domain");
    });

    it("should handle domains without cloudflareHostnameId (subdomains)", async () => {
      const subdomain = {
        ...mockPendingDomain,
        type: $Enums.DomainType.SUBDOMAIN,
        hostname: "test.digitalsite.app",
        cloudflareHostnameId: null,
        ownershipVerification: null,
        sslValidationRecords: null,
      };

      mockPrisma.domain.findUnique.mockResolvedValue(subdomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      expect(result).toBeDefined();
      expect(result.dnsRecords).toBeDefined();
      // Subdomains might have different or no DNS records
    });
  });

  describe("Progress Calculation", () => {
    it("should calculate 0% progress for pending domain", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "pending",
        ssl: {
          status: "pending",
          validation_records: [],
        },
      } as any);

      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      expect(result.progress).toBeDefined();
      expect(result.progress.percentage).toBe(0);
      expect(result.progress.nextStep).toBeDefined();
      expect(result.completedRecords).toBe(0);
      expect(result.totalRecords).toBeGreaterThan(0);
    });

    it("should calculate 100% progress for active domain", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockActiveDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "active",
        ssl: {
          status: "active",
          validation_records: [],
        },
      } as any);

      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      expect(result.progress.percentage).toBe(100);
      expect(result.progress.nextStep).toBeUndefined();
      expect(result.completedRecords).toBe(result.totalRecords);
    });

    it("should calculate partial progress for partially verified domain", async () => {
      const partiallyVerified = {
        ...mockPendingDomain,
        status: $Enums.DomainStatus.VERIFIED, // Domain verified but not active yet
        sslStatus: $Enums.SslStatus.PENDING, // SSL pending
      };

      mockPrisma.domain.findUnique.mockResolvedValue(partiallyVerified);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "active",
        ssl: {
          status: "pending_validation",
          validation_records: [
            {
              txt_name: "_acme-challenge.www",
              txt_value: "ssl-token",
            },
          ],
        },
      } as any);

      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      expect(result.progress.percentage).toBeGreaterThan(0);
      expect(result.progress.percentage).toBeLessThan(100);
      expect(result.completedRecords).toBeGreaterThan(0);
      expect(result.completedRecords).toBeLessThan(result.totalRecords);
    });

    it("should return correct totalRecords count", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "pending",
        ssl: {
          status: "pending",
          validation_records: [
            {
              txt_name: "_acme-challenge.www",
              txt_value: "ssl-token",
            },
          ],
        },
      } as any);

      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      // totalRecords only counts required records
      // For PENDING domain: ownership (required) + traffic (required) = 2
      // SSL records are not required until domain is VERIFIED
      let expectedCount = 0;
      if (result.dnsRecords.ownership?.required) expectedCount++;
      if (result.dnsRecords.traffic?.required) expectedCount++;
      if (result.dnsRecords.ssl) {
        expectedCount += result.dnsRecords.ssl.filter(r => r.required).length;
      }

      expect(result.totalRecords).toBe(expectedCount);
    });
  });

  describe("External Services (Cloudflare)", () => {
    it("should fetch latest SSL validation records from Cloudflare", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      const newSslRecords = [
        {
          txt_name: "_acme-challenge.www",
          txt_value: "updated-ssl-token",
        },
      ];

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "pending",
        ssl: {
          status: "pending_validation",
          validation_records: newSslRecords,
        },
      } as any);

      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      expect(vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails)).toHaveBeenCalledWith(
        mockPendingDomain.cloudflareHostnameId,
        "test-zone-id"
      );

      // Check SSL records contain the updated token
      expect(result.dnsRecords.ssl).toBeDefined();
      const sslRecord = result.dnsRecords.ssl?.find(r => r.value === "updated-ssl-token");
      expect(sslRecord).toBeDefined();
    });

    it("should handle Cloudflare API timeout", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      const timeoutError = new Error("timeout");
      (timeoutError as any).code = "ETIMEDOUT";
      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockRejectedValue(timeoutError);

      // Service continues without SSL records even on timeout
      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      // Should return DNS instructions even if Cloudflare times out
      expect(result).toHaveProperty("dnsRecords");
      expect(result).toHaveProperty("domain");
    });

    it("should handle Cloudflare rate limit", async () => {
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

      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      // Should return DNS instructions even if Cloudflare rate limits
      expect(result).toHaveProperty("dnsRecords");
      expect(result).toHaveProperty("domain");
    });
  });

  describe("Success Cases", () => {
    it("should return complete response with all required fields", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "pending",
        ssl: {
          status: "pending",
          validation_records: [],
        },
      } as any);

      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      expect(result).toBeDefined();
      expect(result.domain).toBeDefined();
      expect(result.domain.id).toBe(domainId);
      expect(result.domain.hostname).toBe(mockPendingDomain.hostname);
      expect(result.domain.type).toBe(mockPendingDomain.type);
      expect(result.domain.status).toBe(mockPendingDomain.status);
      expect(result.domain.sslStatus).toBe(mockPendingDomain.sslStatus);
      expect(result.domain.isVerified).toBeDefined();
      expect(result.domain.isActive).toBeDefined();
      expect(result.dnsRecords).toBeDefined();
      expect(result.instructions).toBeDefined();
      expect(result.totalRecords).toBeDefined();
      expect(result.completedRecords).toBeDefined();
      expect(result.progress).toBeDefined();
    });

    it("should include helpful instructions text", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "pending",
        ssl: {
          status: "pending",
          validation_records: [],
        },
      } as any);

      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      expect(result.instructions).toContain("DNS records");
      expect(result.instructions).toContain("domain registrar");
    });

    it("should mark domain as verified/active based on status", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockActiveDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "active",
        ssl: {
          status: "active",
          validation_records: [],
        },
      } as any);

      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      expect(result.domain.isVerified).toBe(true);
      expect(result.domain.isActive).toBe(true);
    });

    it("should mark domain as not verified when PENDING", async () => {
      mockPrisma.domain.findUnique.mockResolvedValue(mockPendingDomain);
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);

      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue({
        id: "cloudflare-hostname-id-123",
        status: "pending",
        ssl: {
          status: "pending",
          validation_records: [],
        },
      } as any);

      const result = await GetDNSInstructionsService.getDNSInstructions(userId, {
        id: domainId,
      });

      expect(result.domain.isVerified).toBe(false);
      expect(result.domain.isActive).toBe(false);
    });
  });
});
