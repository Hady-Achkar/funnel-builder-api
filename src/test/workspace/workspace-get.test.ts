import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetWorkspaceService } from "../../services/workspace/get";
import { GetWorkspaceController } from "../../controllers/workspace/get";
import { getPrisma } from "../../lib/prisma";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../errors/http-errors";
import {
  WorkspaceRole,
  WorkspacePermission,
  UserPlan,
  FunnelStatus,
  DomainType,
  DomainStatus,
  SslStatus,
  MembershipStatus,
} from "../../generated/prisma-client";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";

// Mock the prisma client
vi.mock("../../lib/prisma");

describe("Workspace Get Tests", () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      workspace: {
        findUnique: vi.fn(),
      },
      workspaceRolePermTemplate: {
        findMany: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  describe("GetWorkspaceService", () => {
    describe("Get Workspace by Slug", () => {
      it("should return full workspace details for the owner", async () => {
        const userId = 1;
        const slug = "test-workspace";

        const mockWorkspace = {
          id: 1,
          name: "Test Workspace",
          slug: "test-workspace",
          description: "A test workspace",
          image: "https://example.com/image.png",
          settings: { theme: "dark" },
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
          ownerId: 1,
          owner: {
            id: 1,
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            username: "johndoe",
            plan: UserPlan.BUSINESS,
          },
          members: [
            {
              id: 1,
              userId: 2,
              workspaceId: 1,
              role: WorkspaceRole.EDITOR,
              permissions: [WorkspacePermission.EDIT_FUNNELS],
              status: MembershipStatus.ACTIVE,
              joinedAt: new Date("2024-01-02"),
              updatedAt: new Date("2024-01-02"),
              user: {
                id: 2,
                firstName: "Jane",
                lastName: "Smith",
                email: "jane@example.com",
                username: "janesmith",
              },
            },
          ],
          domains: [
            {
              id: 1,
              hostname: "test.example.com",
              type: DomainType.CUSTOM_DOMAIN,
              status: DomainStatus.ACTIVE,
              sslStatus: SslStatus.ACTIVE,
              workspaceId: 1,
              createdBy: 1,
              createdAt: new Date("2024-01-03"),
              updatedAt: new Date("2024-01-03"),
            },
            {
              id: 2,
              hostname: "subdomain.workspace.com",
              type: DomainType.SUBDOMAIN,
              status: DomainStatus.ACTIVE,
              sslStatus: SslStatus.ACTIVE,
              workspaceId: 1,
              createdBy: 1,
              createdAt: new Date("2024-01-04"),
              updatedAt: new Date("2024-01-04"),
            },
          ],
          funnels: [
            {
              id: 1,
              name: "Sales Funnel",
              slug: "sales-funnel",
              status: FunnelStatus.LIVE,
              workspaceId: 1,
              createdBy: 1,
              createdAt: new Date("2024-01-05"),
              updatedAt: new Date("2024-01-10"),
              _count: {
                pages: 5,
              },
            },
            {
              id: 2,
              name: "Lead Gen Funnel",
              slug: "lead-gen",
              status: FunnelStatus.DRAFT,
              workspaceId: 1,
              createdBy: 1,
              createdAt: new Date("2024-01-06"),
              updatedAt: new Date("2024-01-11"),
              _count: {
                pages: 3,
              },
            },
          ],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
        mockPrisma.workspaceRolePermTemplate.findMany.mockResolvedValue([]);

        const result = await GetWorkspaceService.getBySlug(userId, slug);

        expect(result).toBeDefined();
        expect(result.name).toBe("Test Workspace");
        expect(result.slug).toBe("test-workspace");
        expect(result.owner.email).toBe("john@example.com");
        expect(result.currentUserMember.role).toBe(WorkspaceRole.OWNER);
        expect(result.members).toHaveLength(1);
        expect(result.domains).toHaveLength(2);
        expect(result.funnels).toHaveLength(2);

        // Check usage statistics
        expect(result.usage.funnelsUsed).toBe(2);
        expect(result.usage.customDomainsUsed).toBe(1);
        expect(result.usage.subdomainsUsed).toBe(1);
        expect(result.usage.totalDomains).toBe(2);
        expect(result.usage.membersCount).toBe(2); // owner + 1 member
        expect(result.usage.activeFunnels).toBe(1);
        expect(result.usage.draftFunnels).toBe(1);

        // Check limits (BUSINESS plan)
        expect(result.limits.maxFunnels).toBe(10);
        expect(result.limits.maxDomains).toBe(5);
        expect(result.limits.funnelsRemaining).toBe(8);
        expect(result.limits.domainsRemaining).toBe(3);
      });

      it("should return workspace details for a member with permissions", async () => {
        const userId = 2; // Member user
        const slug = "test-workspace";

        const mockWorkspace = {
          id: 1,
          name: "Test Workspace",
          slug: "test-workspace",
          description: null,
          image: null,
          settings: {},
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-15"),
          ownerId: 1,
          owner: {
            id: 1,
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            username: "johndoe",
            plan: UserPlan.FREE,
          },
          members: [
            {
              id: 1,
              userId: 2,
              workspaceId: 1,
              role: WorkspaceRole.ADMIN,
              permissions: [
                WorkspacePermission.MANAGE_WORKSPACE,
                WorkspacePermission.MANAGE_MEMBERS,
              ],
              status: MembershipStatus.ACTIVE,
              joinedAt: new Date("2024-01-02"),
              updatedAt: new Date("2024-01-02"),
              user: {
                id: 2,
                firstName: "Jane",
                lastName: "Smith",
                email: "jane@example.com",
                username: "janesmith",
              },
            },
          ],
          domains: [],
          funnels: [],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
        mockPrisma.workspaceRolePermTemplate.findMany.mockResolvedValue([]);

        const result = await GetWorkspaceService.getBySlug(userId, slug);

        expect(result).toBeDefined();
        expect(result.currentUserMember.role).toBe(WorkspaceRole.ADMIN);
        expect(result.currentUserMember.permissions).toContain(
          WorkspacePermission.MANAGE_WORKSPACE
        );
        expect(result.currentUserMember.permissions).toContain(
          WorkspacePermission.MANAGE_MEMBERS
        );

        // Check limits (FREE plan)
        expect(result.limits.maxFunnels).toBe(3);
        expect(result.limits.maxDomains).toBe(1);
      });

      it("should throw NotFoundError when workspace doesn't exist", async () => {
        const userId = 1;
        const slug = "non-existent";

        mockPrisma.workspace.findUnique.mockResolvedValue(null);

        await expect(
          GetWorkspaceService.getBySlug(userId, slug)
        ).rejects.toThrow(NotFoundError);

        await expect(
          GetWorkspaceService.getBySlug(userId, slug)
        ).rejects.toThrow("Workspace not found");
      });

      it("should throw ForbiddenError when user is not a member", async () => {
        const userId = 999; // Non-member user
        const slug = "test-workspace";

        const mockWorkspace = {
          id: 1,
          name: "Test Workspace",
          slug: "test-workspace",
          description: null,
          image: null,
          settings: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: 1,
          owner: {
            id: 1,
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            username: "johndoe",
            plan: UserPlan.BUSINESS,
          },
          members: [], // No members
          domains: [],
          funnels: [],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

        await expect(
          GetWorkspaceService.getBySlug(userId, slug)
        ).rejects.toThrow(ForbiddenError);

        await expect(
          GetWorkspaceService.getBySlug(userId, slug)
        ).rejects.toThrow("You don't have access to this workspace");
      });

      it("should validate slug format", async () => {
        const userId = 1;
        const invalidSlug = "ab"; // Too short

        await expect(
          GetWorkspaceService.getBySlug(userId, invalidSlug)
        ).rejects.toThrow(BadRequestError);
      });

      it("should handle AGENCY plan limits correctly", async () => {
        const userId = 1;
        const slug = "agency-workspace";

        const mockWorkspace = {
          id: 1,
          name: "Agency Workspace",
          slug: "agency-workspace",
          description: "An agency workspace",
          image: null,
          settings: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: 1,
          owner: {
            id: 1,
            firstName: "Agency",
            lastName: "Owner",
            email: "agency@example.com",
            username: "agency",
            plan: UserPlan.AGENCY,
          },
          members: [],
          domains: Array(15).fill(null).map((_, i) => ({
            id: i + 1,
            hostname: `domain${i}.com`,
            type: DomainType.CUSTOM_DOMAIN,
            status: DomainStatus.ACTIVE,
            sslStatus: SslStatus.ACTIVE,
            workspaceId: 1,
            createdBy: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          funnels: Array(30).fill(null).map((_, i) => ({
            id: i + 1,
            name: `Funnel ${i}`,
            slug: `funnel-${i}`,
            status: FunnelStatus.LIVE,
            workspaceId: 1,
            createdBy: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { pages: 3 },
          })),
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
        mockPrisma.workspaceRolePermTemplate.findMany.mockResolvedValue([]);

        const result = await GetWorkspaceService.getBySlug(userId, slug);

        // Check AGENCY plan limits
        expect(result.limits.maxFunnels).toBe(50);
        expect(result.limits.maxDomains).toBe(20);
        expect(result.limits.funnelsRemaining).toBe(20); // 50 - 30
        expect(result.limits.domainsRemaining).toBe(5); // 20 - 15
      });
    });

    describe("Domain Transformation", () => {
      it("should correctly transform domain data", async () => {
        const userId = 1;
        const slug = "test-workspace";

        const mockWorkspace = {
          id: 1,
          name: "Test Workspace",
          slug: "test-workspace",
          description: null,
          image: null,
          settings: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: 1,
          owner: {
            id: 1,
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            username: "johndoe",
            plan: UserPlan.BUSINESS,
          },
          members: [],
          domains: [
            {
              id: 1,
              hostname: "verified.com",
              type: DomainType.CUSTOM_DOMAIN,
              status: DomainStatus.VERIFIED,
              sslStatus: SslStatus.PENDING,
              workspaceId: 1,
              createdBy: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: 2,
              hostname: "active.com",
              type: DomainType.CUSTOM_DOMAIN,
              status: DomainStatus.ACTIVE,
              sslStatus: SslStatus.ACTIVE,
              workspaceId: 1,
              createdBy: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          funnels: [],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
        mockPrisma.workspaceRolePermTemplate.findMany.mockResolvedValue([]);

        const result = await GetWorkspaceService.getBySlug(userId, slug);

        expect(result.domains[0].isVerified).toBe(true); // VERIFIED status
        expect(result.domains[0].isActive).toBe(false); // Not ACTIVE

        expect(result.domains[1].isVerified).toBe(true); // ACTIVE implies verified
        expect(result.domains[1].isActive).toBe(true); // ACTIVE status
      });
    });
  });

  describe("GetWorkspaceController", () => {
    it("should return 200 with workspace data", async () => {
      const mockReq = {
        userId: 1,
        params: { slug: "test-workspace" },
      } as unknown as AuthRequest;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as unknown as NextFunction;

      const mockResult = {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        owner: { id: 1, email: "owner@example.com" },
        members: [],
        domains: [],
        funnels: [],
        usage: {},
        limits: {},
        currentUserMember: { role: WorkspaceRole.OWNER },
      };

      vi.spyOn(GetWorkspaceService, "getBySlug").mockResolvedValue(
        mockResult as any
      );

      await GetWorkspaceController.getBySlug(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
      expect(GetWorkspaceService.getBySlug).toHaveBeenCalledWith(
        1,
        "test-workspace"
      );
    });

    it("should pass errors to next middleware", async () => {
      const mockReq = {
        userId: 1,
        params: { slug: "test-workspace" },
      } as unknown as AuthRequest;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as unknown as NextFunction;

      const error = new NotFoundError("Workspace not found");
      vi.spyOn(GetWorkspaceService, "getBySlug").mockRejectedValue(error);

      await GetWorkspaceController.getBySlug(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});