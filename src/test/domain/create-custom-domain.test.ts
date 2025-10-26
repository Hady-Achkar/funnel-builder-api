import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CreateCustomDomainService } from "../../services/domain/create-custom-domain/create-custom-domain.service";
import { getPrisma } from "../../lib/prisma";
import { $Enums, UserPlan, AddOnType } from "../../generated/prisma-client";
import * as azureFrontDoor from "../../utils/domain-utils/azure-frontdoor-custom-domain";

vi.mock("../../lib/prisma");
vi.mock("../../utils/domain-utils/azure-frontdoor-custom-domain");

describe("Create Custom Domain Tests", () => {
  let mockPrisma: any;
  const userId = 1;
  const workspaceSlug = "test-workspace";
  const hostname = "www.example.com";

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockWorkspace = {
    id: 1,
    slug: workspaceSlug,
    name: "Test Workspace",
    ownerId: userId,
    planType: UserPlan.BUSINESS, // Business plan allows custom domains
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

  const mockCloudflareHostname = {
    id: "cloudflare-hostname-id-123",
    hostname,
    ownership_verification: {
      type: "txt",
      name: "_cf-custom-hostname.example.com",
      value: "verification-token-123",
    },
    ssl: {
      status: "pending",
      validation_records: [
        {
          txt_name: "_acme-challenge.www",
          txt_value: "ssl-verification-token",
        },
      ],
    },
    status: "pending",
  };

  const mockCreatedDomain = {
    id: 1,
    hostname,
    type: $Enums.DomainType.CUSTOM_DOMAIN,
    status: $Enums.DomainStatus.PENDING,
    sslStatus: $Enums.SslStatus.PENDING,
    workspaceId: 1,
    createdBy: userId,
    verificationToken: mockCloudflareHostname.ownership_verification.value,
    ownershipVerification: mockCloudflareHostname.ownership_verification,
    dnsInstructions: {
      type: "CNAME",
      name: "www",
      value: "fallback.mydigitalsite.io",
      purpose: "Live Traffic",
    },
    sslValidationRecords: mockCloudflareHostname.ssl.validation_records,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastVerifiedAt: null,
  };

  describe("Validation", () => {
    it("should reject empty hostname", async () => {
      await expect(
        CreateCustomDomainService.create(userId, {
          hostname: "",
          workspaceSlug,
        })
      ).rejects.toThrow();
    });

    it("should reject missing workspaceSlug", async () => {
      await expect(
        CreateCustomDomainService.create(userId, {
          hostname,
          workspaceSlug: "",
        })
      ).rejects.toThrow();
    });

    it("should reject invalid hostname format (no TLD)", async () => {
      await expect(
        CreateCustomDomainService.create(userId, {
          hostname: "invalid-domain",
          workspaceSlug,
        })
      ).rejects.toThrow();
    });

    it("should reject hostname with spaces", async () => {
      await expect(
        CreateCustomDomainService.create(userId, {
          hostname: "www.example .com",
          workspaceSlug,
        })
      ).rejects.toThrow();
    });

    it("should reject hostname with special characters", async () => {
      await expect(
        CreateCustomDomainService.create(userId, {
          hostname: "www.exam!ple.com",
          workspaceSlug,
        })
      ).rejects.toThrow();
    });

    it.skip("should reject apex domain (must have subdomain)", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(0);

      await expect(
        CreateCustomDomainService.create(userId, {
          hostname: "example.com", // Apex domain without subdomain
          workspaceSlug,
        })
      ).rejects.toThrow(/subdomain/);
    });
  });

  describe("Authorization", () => {
    it("should throw error when workspace does not exist", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(
        CreateCustomDomainService.create(userId, {
          hostname,
          workspaceSlug,
        })
      ).rejects.toThrow("Workspace not found");
    });

    it("should throw error when user is not a member of workspace", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        CreateCustomDomainService.create(userId, {
          hostname,
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
        CreateCustomDomainService.create(userId, {
          hostname,
          workspaceSlug,
        })
      ).rejects.toThrow();
    });
  });

  describe("Allocation Limits", () => {
    it("should enforce custom domain limit for FREE plan (0 custom domains)", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        planType: UserPlan.FREE,
        addOns: [],
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(0);

      await expect(
        CreateCustomDomainService.create(userId, {
          hostname,
          workspaceSlug,
        })
      ).rejects.toThrow(/maximum limit of 0 custom domain/);
    });

    it("should enforce custom domain limit for BUSINESS plan (1 custom domain)", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        planType: UserPlan.BUSINESS,
        addOns: [],
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(1); // Already has 1 custom domain

      await expect(
        CreateCustomDomainService.create(userId, {
          hostname,
          workspaceSlug,
        })
      ).rejects.toThrow(/maximum limit of 1 custom domain/);
    });

    it.skip("should allow custom domain creation for BUSINESS plan when under limit", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        planType: UserPlan.BUSINESS,
        addOns: [],
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(0); // No custom domains yet
      mockPrisma.domain.findUnique.mockResolvedValue(null); // Not taken
      mockPrisma.domain.create.mockResolvedValue(mockCreatedDomain);

      vi.mocked(cloudflareCustomHostname.addCustomHostname).mockResolvedValue(
        mockCloudflareHostname as any
      );
      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue(
        mockCloudflareHostname as any
      );

      const result = await CreateCustomDomainService.create(userId, {
        hostname,
        workspaceSlug,
      });

      expect(result).toBeDefined();
      expect(result.domain.hostname).toBe(hostname);
    });

    it.skip("should respect EXTRA_CUSTOM_DOMAIN add-ons for increased limits", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        planType: UserPlan.BUSINESS,
        addOns: [
          {
            type: AddOnType.EXTRA_CUSTOM_DOMAIN,
            quantity: 2,
            status: "ACTIVE",
          },
        ],
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(2); // Has 2 custom domains (base 1 + 2 add-ons = 3 total)
      mockPrisma.domain.findUnique.mockResolvedValue(null);
      mockPrisma.domain.create.mockResolvedValue(mockCreatedDomain);

      vi.mocked(cloudflareCustomHostname.addCustomHostname).mockResolvedValue(
        mockCloudflareHostname as any
      );
      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue(
        mockCloudflareHostname as any
      );

      const result = await CreateCustomDomainService.create(userId, {
        hostname,
        workspaceSlug,
      });

      expect(result).toBeDefined();
      expect(result.message).toContain("registered");
    });

    it("should enforce limit even with add-ons when at capacity", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        planType: UserPlan.BUSINESS,
        addOns: [
          {
            type: AddOnType.EXTRA_CUSTOM_DOMAIN,
            quantity: 2,
            status: "ACTIVE",
          },
        ],
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(3); // At capacity (1 base + 2 add-ons = 3)

      await expect(
        CreateCustomDomainService.create(userId, {
          hostname,
          workspaceSlug,
        })
      ).rejects.toThrow(/maximum limit of 3 custom domain/);
    });

    it.skip("should allow FREE plan with EXTRA_CUSTOM_DOMAIN add-ons", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        planType: UserPlan.FREE,
        addOns: [
          {
            type: AddOnType.EXTRA_CUSTOM_DOMAIN,
            quantity: 1,
            status: "ACTIVE",
          },
        ],
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(0); // No domains yet (0 base + 1 add-on = 1 total)
      mockPrisma.domain.findUnique.mockResolvedValue(null);
      mockPrisma.domain.create.mockResolvedValue(mockCreatedDomain);

      vi.mocked(cloudflareCustomHostname.addCustomHostname).mockResolvedValue(
        mockCloudflareHostname as any
      );
      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue(
        mockCloudflareHostname as any
      );

      const result = await CreateCustomDomainService.create(userId, {
        hostname,
        workspaceSlug,
      });

      expect(result).toBeDefined();
    });

    it("should not count inactive add-ons towards limit", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        planType: UserPlan.BUSINESS,
        addOns: [
          {
            type: AddOnType.EXTRA_CUSTOM_DOMAIN,
            quantity: 2,
            status: "INACTIVE", // Inactive add-on
          },
        ],
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(1); // At capacity without add-ons

      await expect(
        CreateCustomDomainService.create(userId, {
          hostname,
          workspaceSlug,
        })
      ).rejects.toThrow(/maximum limit of 1 custom domain/);
    });
  });

  describe("Business Logic", () => {
    it("should reject duplicate hostname", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(0);
      mockPrisma.domain.findUnique.mockResolvedValue({
        id: 999,
        hostname,
      }); // Hostname already exists

      await expect(
        CreateCustomDomainService.create(userId, {
          hostname,
          workspaceSlug,
        })
      ).rejects.toThrow(/taken/);
    });

    it.skip("should normalize hostname to lowercase", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(0);
      mockPrisma.domain.findUnique.mockResolvedValue(null);
      mockPrisma.domain.create.mockResolvedValue(mockCreatedDomain);

      vi.mocked(cloudflareCustomHostname.addCustomHostname).mockResolvedValue(
        mockCloudflareHostname as any
      );
      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue(
        mockCloudflareHostname as any
      );

      await CreateCustomDomainService.create(userId, {
        hostname: "WWW.EXAMPLE.COM",
        workspaceSlug,
      });

      expect(vi.mocked(cloudflareCustomHostname.addCustomHostname)).toHaveBeenCalledWith(
        "www.example.com",
        "test-zone-id"
      );
    });

    it.skip("should include both TXT and CNAME records in setup instructions", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(0);
      mockPrisma.domain.findUnique.mockResolvedValue(null);
      mockPrisma.domain.create.mockResolvedValue(mockCreatedDomain);

      vi.mocked(cloudflareCustomHostname.addCustomHostname).mockResolvedValue(
        mockCloudflareHostname as any
      );
      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue(
        mockCloudflareHostname as any
      );

      const result = await CreateCustomDomainService.create(userId, {
        hostname,
        workspaceSlug,
      });

      expect(result.setupInstructions.records).toHaveLength(2);
      expect(result.setupInstructions.records[0].type).toBe("TXT");
      expect(result.setupInstructions.records[0].purpose).toContain("Verification");
      expect(result.setupInstructions.records[1].type).toBe("CNAME");
      expect(result.setupInstructions.records[1].purpose).toContain("Live Traffic");
    });

    it.skip("should store SSL validation records when provided", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(0);
      mockPrisma.domain.findUnique.mockResolvedValue(null);
      mockPrisma.domain.create.mockResolvedValue(mockCreatedDomain);

      vi.mocked(cloudflareCustomHostname.addCustomHostname).mockResolvedValue(
        mockCloudflareHostname as any
      );
      vi.mocked(cloudflareCustomHostname.getCustomHostnameDetails).mockResolvedValue(
        mockCloudflareHostname as any
      );

      await CreateCustomDomainService.create(userId, {
        hostname,
        workspaceSlug,
      });

      expect(mockPrisma.domain.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sslValidationRecords: expect.any(Array),
          }),
        })
      );
    });
  });

  describe("Success Cases", () => {
    it.skip("should successfully create custom domain with all correct data", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(0);
      mockPrisma.domain.findUnique.mockResolvedValue(null);
      mockPrisma.domain.create.mockResolvedValue(mockCreatedDomain);

      vi.mocked(azureFrontDoor.createAzureFrontDoorCustomDomain).mockResolvedValue({
        id: "azure-domain-id",
        name: "www-example-com",
        hostName: hostname,
        validationProperties: {
          validationToken: "_validation_token_123",
        },
        domainValidationState: "Pending",
        tlsSettings: {
          certificateType: "ManagedCertificate",
          minimumTlsVersion: "TLS12",
        },
      });

      const result = await CreateCustomDomainService.create(userId, {
        hostname,
        workspaceSlug,
      });

      expect(result.message).toContain("registered");
      expect(result.domain).toBeDefined();
      expect(result.domain.id).toBe(1);
      expect(result.domain.hostname).toBe(hostname);
      expect(result.domain.type).toBe($Enums.DomainType.CUSTOM_DOMAIN);
      expect(result.domain.status).toBe($Enums.DomainStatus.PENDING);
      expect(result.domain.sslStatus).toBe($Enums.SslStatus.PENDING);
      expect(result.domain.isVerified).toBe(false);
      expect(result.domain.isActive).toBe(false);
      expect(result.setupInstructions).toBeDefined();
    });

    it.skip("should store correct data in database", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.domain.count.mockResolvedValue(0);
      mockPrisma.domain.findUnique.mockResolvedValue(null);
      mockPrisma.domain.create.mockResolvedValue(mockCreatedDomain);

      vi.mocked(azureFrontDoor.createAzureFrontDoorCustomDomain).mockResolvedValue({
        id: "azure-domain-id",
        name: "www-example-com",
        hostName: hostname,
        validationProperties: {
          validationToken: "_validation_token_123",
        },
        domainValidationState: "Pending",
        tlsSettings: {
          certificateType: "ManagedCertificate",
          minimumTlsVersion: "TLS12",
        },
      });

      await CreateCustomDomainService.create(userId, {
        hostname,
        workspaceSlug,
      });

      expect(mockPrisma.domain.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hostname,
            type: $Enums.DomainType.CUSTOM_DOMAIN,
            status: $Enums.DomainStatus.PENDING,
            sslStatus: $Enums.SslStatus.PENDING,
            workspaceId: mockWorkspace.id,
            createdBy: userId,
            verificationToken: mockCloudflareHostname.ownership_verification.value,
          }),
        })
      );
    });
  });
});
