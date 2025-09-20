import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFunnel } from "../../services/funnel/create";
import { checkWorkspaceSubdomainLimits } from "../../helpers/domain/create-subdomain/subdomain-limits.helper";
import { checkWorkspaceDomainLimits } from "../../helpers/domain/create-custom-domain/domain-limits.helper";
import { getPrisma } from "../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../errors/http-errors";
import { DomainType, WorkspaceRole, WorkspacePermission } from "../../generated/prisma-client";

// Mock the prisma client
vi.mock("../../lib/prisma");

describe("Workspace Resource Limits Tests", () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      workspace: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
      },
      funnel: {
        count: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      domain: {
        count: vi.fn(),
        findUnique: vi.fn(),
      },
      theme: {
        create: vi.fn(),
      },
      funnelSettings: {
        create: vi.fn(),
      },
      page: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  describe("Funnel limits (3 per workspace)", () => {
    it("should allow creating a funnel when under the 3-funnel limit", async () => {
      const userId = 1;
      const workspaceId = 1;
      const funnelData = {
        name: "Test Funnel",
        workspaceSlug: "test-workspace",
        status: "DRAFT",
      };

      // Mock workspace with 2 existing funnels
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: "Test Workspace",
        ownerId: userId,
      });

      mockPrisma.funnel.count.mockResolvedValue(2);
      mockPrisma.funnel.findFirst.mockResolvedValue(null);

      // Mock successful transaction
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          funnel: {
            create: vi.fn().mockResolvedValue({
              id: 3,
              name: funnelData.name,
              slug: "test-funnel",
              workspaceId,
            }),
            update: vi.fn().mockResolvedValue({
              id: 3,
              name: funnelData.name,
              slug: "test-funnel",
              workspaceId,
            }),
            findMany: vi.fn().mockResolvedValue([]),
          },
          theme: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          funnelSettings: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
          page: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
          },
        };
        return callback(txMock);
      });

      const result = await createFunnel(userId, funnelData as any);

      expect(result.response.funnelId).toBeDefined();
      expect(mockPrisma.funnel.count).toHaveBeenCalledWith({
        where: { workspaceId },
      });
    });

    it("should prevent creating a 4th funnel in a workspace", async () => {
      const userId = 1;
      const workspaceId = 1;
      const funnelData = {
        name: "Fourth Funnel",
        workspaceSlug: "test-workspace",
        status: "DRAFT",
      };

      // Mock workspace with 3 existing funnels (at limit)
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: "Test Workspace",
        ownerId: userId,
      });

      mockPrisma.funnel.count.mockResolvedValue(3);

      await expect(createFunnel(userId, funnelData as any)).rejects.toThrow(
        "This workspace has reached its maximum limit of 3 funnels."
      );
    });

    it("should enforce 3-funnel limit for non-owner members with permissions", async () => {
      const userId = 2;
      const workspaceId = 1;
      const funnelData = {
        name: "Member Funnel",
        workspaceSlug: "test-workspace",
        status: "DRAFT",
      };

      // Mock workspace owned by someone else
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: "Test Workspace",
        ownerId: 999, // Different owner
      });

      // Mock member with create permissions
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        role: WorkspaceRole.EDITOR,
        permissions: [WorkspacePermission.CREATE_FUNNELS],
      });

      // Workspace at limit
      mockPrisma.funnel.count.mockResolvedValue(3);

      await expect(createFunnel(userId, funnelData as any)).rejects.toThrow(
        "This workspace has reached its maximum limit of 3 funnels."
      );
    });
  });

  describe("Subdomain limits (3 per workspace)", () => {
    it("should allow creating a subdomain when under the 3-subdomain limit", async () => {
      const workspaceId = 1;

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
      });

      mockPrisma.domain.count.mockResolvedValue(2);

      await expect(
        checkWorkspaceSubdomainLimits(workspaceId)
      ).resolves.not.toThrow();

      expect(mockPrisma.domain.count).toHaveBeenCalledWith({
        where: {
          workspaceId,
          type: DomainType.SUBDOMAIN,
        },
      });
    });

    it("should prevent creating a 4th subdomain in a workspace", async () => {
      const workspaceId = 1;

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
      });

      mockPrisma.domain.count.mockResolvedValue(3);

      await expect(checkWorkspaceSubdomainLimits(workspaceId)).rejects.toThrow(
        BadRequestError
      );

      await expect(checkWorkspaceSubdomainLimits(workspaceId)).rejects.toThrow(
        "This workspace has reached its maximum limit of 3 subdomains."
      );
    });

    it("should throw NotFoundError for non-existent workspace", async () => {
      const workspaceId = 999;

      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(checkWorkspaceSubdomainLimits(workspaceId)).rejects.toThrow(
        NotFoundError
      );

      await expect(checkWorkspaceSubdomainLimits(workspaceId)).rejects.toThrow(
        "Workspace not found"
      );
    });
  });

  describe("Custom domain limits (3 per workspace)", () => {
    it("should allow creating a custom domain when under the 3-domain limit", async () => {
      const workspaceId = 1;

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
      });

      mockPrisma.domain.count.mockResolvedValue(1);

      await expect(
        checkWorkspaceDomainLimits(workspaceId)
      ).resolves.not.toThrow();

      expect(mockPrisma.domain.count).toHaveBeenCalledWith({
        where: {
          workspaceId,
          type: DomainType.CUSTOM_DOMAIN,
        },
      });
    });

    it("should prevent creating a 4th custom domain in a workspace", async () => {
      const workspaceId = 1;

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
      });

      mockPrisma.domain.count.mockResolvedValue(3);

      await expect(checkWorkspaceDomainLimits(workspaceId)).rejects.toThrow(
        BadRequestError
      );

      await expect(checkWorkspaceDomainLimits(workspaceId)).rejects.toThrow(
        "This workspace has reached its maximum limit of 3 custom domains."
      );
    });

    it("should count only custom domains, not subdomains", async () => {
      const workspaceId = 1;

      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
      });

      // Only 2 custom domains, even if there are subdomains
      mockPrisma.domain.count.mockResolvedValue(2);

      await expect(
        checkWorkspaceDomainLimits(workspaceId)
      ).resolves.not.toThrow();

      // Verify it's filtering by CUSTOM_DOMAIN type
      expect(mockPrisma.domain.count).toHaveBeenCalledWith({
        where: {
          workspaceId,
          type: DomainType.CUSTOM_DOMAIN,
        },
      });
    });
  });

  describe("Fixed limits across all plans", () => {
    it("should apply same 3-item limits regardless of user plan", async () => {
      const workspaceId = 1;

      // Test for funnels - same limit for all plans
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: "Test Workspace",
        ownerId: 1,
      });

      mockPrisma.funnel.count.mockResolvedValue(3);

      // Create funnel request for FREE plan user
      await expect(
        createFunnel(1, {
          name: "Test Funnel",
          workspaceSlug: "test-workspace",
          status: "DRAFT",
        } as any)
      ).rejects.toThrow("This workspace has reached its maximum limit of 3 funnels.");

      // Same limit applies for BUSINESS plan user
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: "Business Workspace",
        ownerId: 2,
      });

      await expect(
        createFunnel(2, {
          name: "Business Funnel",
          workspaceSlug: "business-workspace",
          status: "DRAFT",
        } as any)
      ).rejects.toThrow("This workspace has reached its maximum limit of 3 funnels.");

      // Same limit applies for AGENCY plan user
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: "Agency Workspace",
        ownerId: 3,
      });

      await expect(
        createFunnel(3, {
          name: "Agency Funnel",
          workspaceSlug: "agency-workspace",
          status: "DRAFT",
        } as any)
      ).rejects.toThrow("This workspace has reached its maximum limit of 3 funnels.");
    });
  });
});