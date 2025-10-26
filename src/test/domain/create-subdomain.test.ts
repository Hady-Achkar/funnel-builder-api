import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CreateSubdomainService } from "../../services/domain/create-subdomain/create-subdomain.service";
import { getPrisma } from "../../lib/prisma";
import { $Enums, UserPlan, AddOnType } from "../../generated/prisma-client";
import * as cloudflareApi from "../../utils/domain-utils/cloudflare-api";
import * as createARecord from "../../services/domain/create-subdomain/utils/create-a-record";

vi.mock("../../lib/prisma");
vi.mock("../../utils/domain-utils/cloudflare-api");
vi.mock("../../services/domain/create-subdomain/utils/create-a-record");

describe.skip("Create Subdomain Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const workspaceSlug = "test-workspace";
  const subdomain = "test-subdomain";

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
        count: vi.fn(),
        create: vi.fn(),
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
    slug: workspaceSlug,
    name: "Test Workspace",
    ownerId: userId,
    planType: UserPlan.FREE,
    addOns: [],
  };

  const mockMember = {
    id: 1,
    userId,
    workspaceId: 1,
    role: "OWNER",
    status: "ACTIVE",
    permissions: [$Enums.WorkspacePermission.CREATE_DOMAINS],
  };

  const mockARecord = {
    id: "cloudflare-record-id-123",
    type: "A",
    name: subdomain,
    content: "74.234.194.84",
  };

  const mockCreatedDomain = {
    id: 1,
    hostname: `${subdomain}.mydigitalsite.io`,
    type: $Enums.DomainType.SUBDOMAIN,
    status: $Enums.DomainStatus.ACTIVE,
    sslStatus: $Enums.SslStatus.ACTIVE,
    workspaceId: 1,
    createdBy: userId,
    azureCustomDomainName: `${subdomain}-mydigitalsite-io`,
    azureDomainStatus: "Approved",
    azureCertStatus: "ManagedCertificate",
    lastVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    verificationToken: null,
    ownershipVerification: null,
    dnsInstructions: null,
    sslValidationRecords: null,
  };

  describe("Validation", () => {
    it("should reject empty subdomain", async () => {
      await expect(
        CreateSubdomainService.create(userId, {
          subdomain: "",
          workspaceSlug,
        })
      ).rejects.toThrow();
    });

    it("should reject missing workspaceSlug", async () => {
      await expect(
        CreateSubdomainService.create(userId, {
          subdomain,
          workspaceSlug: "",
        })
      ).rejects.toThrow();
    });

    it("should reject invalid subdomain format (spaces)", async () => {
      await expect(
        CreateSubdomainService.create(userId, {
          subdomain: "test subdomain",
          workspaceSlug,
        })
      ).rejects.toThrow();
    });

    it("should reject invalid subdomain format (special chars)", async () => {
      await expect(
        CreateSubdomainService.create(userId, {
          subdomain: "test@subdomain",
          workspaceSlug,
        })
      ).rejects.toThrow();
    });

    it("should reject subdomain that is too long", async () => {
      const longSubdomain = "a".repeat(64);
      await expect(
        CreateSubdomainService.create(userId, {
          subdomain: longSubdomain,
          workspaceSlug,
        })
      ).rejects.toThrow();
    });
  });

  describe("Authorization", () => {
    it("should throw error when workspace does not exist", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        CreateSubdomainService.create(userId, {
          subdomain,
          workspaceSlug,
        })
      ).rejects.toThrow("Workspace not found");
    });

    it("should throw error when user is not a member of workspace", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        CreateSubdomainService.create(userId, {
          subdomain,
          workspaceSlug,
        })
      ).rejects.toThrow();
    });

    it("should throw error when user does not have CREATE_DOMAINS permission", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        ...mockMember,
        permissions: [], // No permissions
      });

      await expect(
        CreateSubdomainService.create(userId, {
          subdomain,
          workspaceSlug,
        })
      ).rejects.toThrow();
    });
  });

  describe("Allocation Limits", () => {
    it("should enforce subdomain limit for FREE plan (1 subdomain)", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        planType: UserPlan.FREE,
        addOns: [],
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(1); // Already has 1 subdomain

      await expect(
        CreateSubdomainService.create(userId, {
          subdomain,
          workspaceSlug,
        })
      ).rejects.toThrow(/maximum limit/);
    });

    it("should allow subdomain creation when under limit (FREE plan)", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        planType: UserPlan.FREE,
        addOns: [],
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(0); // No subdomains yet
      mockPrisma.domain.findUnique.mockResolvedValue(null); // Not taken
      mockPrisma.domain.create.mockResolvedValue(mockCreatedDomain);
      vi.mocked(createARecord.createARecord).mockResolvedValue(
        mockARecord as any
      );

      const result = await CreateSubdomainService.create(userId, {
        subdomain,
        workspaceSlug,
      });

      expect(result).toBeDefined();
      expect(result.domain.hostname).toBe(`${subdomain}.mydigitalsite.io`);
    });

    it("should respect EXTRA_SUBDOMAIN add-ons for increased limits", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        planType: UserPlan.FREE,
        addOns: [
          {
            type: AddOnType.EXTRA_SUBDOMAIN,
            quantity: 2,
            status: "ACTIVE",
          },
        ],
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(2); // Has 2 subdomains (base 1 + 2 add-ons = 3 total)
      mockPrisma.domain.findUnique.mockResolvedValue(null);
      mockPrisma.domain.create.mockResolvedValue(mockCreatedDomain);
      vi.mocked(createARecord.createARecord).mockResolvedValue(
        mockARecord as any
      );

      const result = await CreateSubdomainService.create(userId, {
        subdomain,
        workspaceSlug,
      });

      expect(result).toBeDefined();
      expect(result.message).toContain("successfully");
    });

    it("should enforce limit even with add-ons when at capacity", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        planType: UserPlan.FREE,
        addOns: [
          {
            type: AddOnType.EXTRA_SUBDOMAIN,
            quantity: 2,
            status: "ACTIVE",
          },
        ],
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(3); // At capacity (1 base + 2 add-ons = 3)

      await expect(
        CreateSubdomainService.create(userId, {
          subdomain,
          workspaceSlug,
        })
      ).rejects.toThrow(/maximum limit of 3 subdomain/);
    });

    it("should not count inactive add-ons towards limit", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        planType: UserPlan.FREE,
        addOns: [
          {
            type: AddOnType.EXTRA_SUBDOMAIN,
            quantity: 2,
            status: "INACTIVE", // Inactive add-on
          },
        ],
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(1); // At capacity without add-ons

      await expect(
        CreateSubdomainService.create(userId, {
          subdomain,
          workspaceSlug,
        })
      ).rejects.toThrow(/maximum limit of 1 subdomain/);
    });
  });

  describe("Business Logic", () => {
    it("should reject duplicate subdomain", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(0);
      mockPrisma.domain.findUnique.mockResolvedValue({
        id: 999,
        hostname: `${subdomain}.mydigitalsite.io`,
      }); // Subdomain already exists

      await expect(
        CreateSubdomainService.create(userId, {
          subdomain,
          workspaceSlug,
        })
      ).rejects.toThrow(/already taken/);
    });

    it.skip("should create subdomain with correct hostname format", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(0);
      mockPrisma.domain.findUnique.mockResolvedValue(null);
      mockPrisma.domain.create.mockResolvedValue(mockCreatedDomain);
      vi.mocked(createARecord.createARecord).mockResolvedValue(
        mockARecord as any
      );

      await CreateSubdomainService.create(userId, {
        subdomain: "my-test",
        workspaceSlug,
      });

      expect(mockPrisma.domain.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hostname: "my-test.mydigitalsite.io",
            type: $Enums.DomainType.SUBDOMAIN,
            status: $Enums.DomainStatus.ACTIVE,
            sslStatus: $Enums.SslStatus.ACTIVE,
          }),
        })
      );
    });
  });

  describe("Success Cases", () => {
    it("should successfully create subdomain with all correct data", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(0);
      mockPrisma.domain.findUnique.mockResolvedValue(null);
      mockPrisma.domain.create.mockResolvedValue(mockCreatedDomain);
      vi.mocked(createARecord.createARecord).mockResolvedValue(
        mockARecord as any
      );

      const result = await CreateSubdomainService.create(userId, {
        subdomain,
        workspaceSlug,
      });

      expect(result.message).toContain("successfully");
      expect(result.domain).toBeDefined();
      expect(result.domain.id).toBe(1);
      expect(result.domain.hostname).toBe(`${subdomain}.mydigitalsite.io`);
      expect(result.domain.type).toBe($Enums.DomainType.SUBDOMAIN);
      expect(result.domain.status).toBe($Enums.DomainStatus.ACTIVE);
      expect(result.domain.sslStatus).toBe($Enums.SslStatus.ACTIVE);
      expect(result.domain.isVerified).toBe(true);
      expect(result.domain.isActive).toBe(true);
    });

    it.skip("should store correct data in database", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(0);
      mockPrisma.domain.findUnique.mockResolvedValue(null);
      mockPrisma.domain.create.mockResolvedValue(mockCreatedDomain);
      vi.mocked(createARecord.createARecord).mockResolvedValue(
        mockARecord as any
      );

      await CreateSubdomainService.create(userId, {
        subdomain,
        workspaceSlug,
      });

      expect(mockPrisma.domain.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hostname: `${subdomain}.mydigitalsite.io`,
            type: $Enums.DomainType.SUBDOMAIN,
            status: $Enums.DomainStatus.ACTIVE,
            sslStatus: $Enums.SslStatus.ACTIVE,
            workspaceId: mockWorkspace.id,
            createdBy: userId,
            azureCustomDomainName: expect.any(String),
            azureDomainStatus: "Approved",
            azureCertStatus: "ManagedCertificate",
            lastVerifiedAt: expect.any(Date),
          }),
        })
      );
    });
  });
});
