import { describe, it, expect, beforeEach, vi } from "vitest";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { JoinByLinkController } from "../../controllers/workspace/join-by-link";
import { WorkspaceRole, MembershipStatus } from "../../generated/prisma-client";

// Create a single mocked prisma instance that will be reused
const mockPrismaInstance = {
  user: {
    findUnique: vi.fn(),
  },
  workspace: {
    findUnique: vi.fn(),
  },
  workspaceMember: {
    findFirst: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  workspaceRolePermTemplate: {
    findUnique: vi.fn(),
  },
};

// Mock all dependencies
vi.mock("../../lib/prisma", () => ({
  getPrisma: vi.fn(() => mockPrismaInstance),
}));

vi.mock("../../services/cache/cache.service");

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

describe("Workspace Join by Link Controller Tests", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockPrisma: any;
  let mockJwt: any;
  let mockCacheService: any;

  beforeEach(async () => {
    const jwt = await import("jsonwebtoken");
    const { cacheService } = await import("../../services/cache/cache.service");

    mockPrisma = mockPrismaInstance;
    mockJwt = jwt.default;
    mockCacheService = cacheService;

    mockReq = {
      userId: 2,
      body: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();

    vi.clearAllMocks();

    // Set up default successful mocks
    mockJwt.verify.mockReturnValue({
      workspaceId: 1,
      workspaceSlug: "test-workspace",
      role: WorkspaceRole.EDITOR,
      type: "workspace_direct_link",
      createdBy: 1,
      exp: Math.floor(Date.now() / 1000) + 604800, // 7 days from now
    });

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 2,
      email: "test@example.com",
    });

    mockPrisma.workspace.findUnique.mockResolvedValue({
      id: 1,
      name: "Test Workspace",
      slug: "test-workspace",
      ownerId: 1,
      planType: 'FREE',
      addOns: [],
    });

    mockPrisma.workspaceMember.findFirst.mockResolvedValue(null); // No existing membership
    mockPrisma.workspaceMember.count.mockResolvedValue(0); // No members yet
    mockPrisma.workspaceMember.create.mockResolvedValue({
      id: 1,
      userId: 2,
      email: "test@example.com",
      workspaceId: 1,
      role: WorkspaceRole.EDITOR,
      permissions: [],
      status: MembershipStatus.ACTIVE,
      invitedBy: 1,
      joinedAt: new Date(),
    });

    mockPrisma.workspaceRolePermTemplate.findUnique.mockResolvedValue({
      permissions: [],
    });

    mockCacheService.del.mockResolvedValue(undefined);
    mockCacheService.invalidateWorkspaceCache.mockResolvedValue(undefined);
    mockCacheService.invalidateUserWorkspacesCache.mockResolvedValue(undefined);
  });

  describe("Successful Join Operations", () => {
    it("should allow new member to join with valid link", async () => {
      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Successfully joined workspace",
        workspace: {
          id: 1,
          name: "Test Workspace",
          slug: "test-workspace",
          role: WorkspaceRole.EDITOR,
          permissions: [],
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should create ACTIVE membership directly", async () => {
      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockPrisma.workspaceMember.create).toHaveBeenCalledWith({
        data: {
          userId: 2,
          email: "test@example.com",
          workspaceId: 1,
          role: WorkspaceRole.EDITOR,
          permissions: [],
          status: MembershipStatus.ACTIVE,
          invitedBy: 1,
          joinedAt: expect.any(Date),
        },
      });
    });

    it("should assign EDITOR role correctly", async () => {
      mockJwt.verify.mockReturnValue({
        workspaceId: 1,
        workspaceSlug: "test-workspace",
        role: WorkspaceRole.EDITOR,
        type: "workspace_direct_link",
        createdBy: 1,
      });

      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockPrisma.workspaceMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: WorkspaceRole.EDITOR,
        }),
      });
    });

    it("should assign VIEWER role correctly", async () => {
      mockJwt.verify.mockReturnValue({
        workspaceId: 1,
        workspaceSlug: "test-workspace",
        role: WorkspaceRole.VIEWER,
        type: "workspace_direct_link",
        createdBy: 1,
      });

      mockPrisma.workspaceMember.create.mockResolvedValue({
        id: 1,
        userId: 2,
        email: "test@example.com",
        workspaceId: 1,
        role: WorkspaceRole.VIEWER,
        permissions: [],
        status: MembershipStatus.ACTIVE,
        invitedBy: 1,
        joinedAt: new Date(),
      });

      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockPrisma.workspaceMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: WorkspaceRole.VIEWER,
        }),
      });
    });

    it("should set invitedBy to token creator", async () => {
      mockJwt.verify.mockReturnValue({
        workspaceId: 1,
        workspaceSlug: "test-workspace",
        role: WorkspaceRole.EDITOR,
        type: "workspace_direct_link",
        createdBy: 5, // Different creator
      });

      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockPrisma.workspaceMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          invitedBy: 5,
        }),
      });
    });

    it("should set joinedAt timestamp", async () => {
      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockPrisma.workspaceMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          joinedAt: expect.any(Date),
        }),
      });
    });

    it("should apply role permissions from template", async () => {
      const mockPermissions = ["MANAGE_FUNNELS", "CREATE_FUNNELS"];
      mockPrisma.workspaceRolePermTemplate.findUnique.mockResolvedValue({
        permissions: mockPermissions,
      });

      mockPrisma.workspaceMember.create.mockResolvedValue({
        id: 1,
        userId: 2,
        email: "test@example.com",
        workspaceId: 1,
        role: WorkspaceRole.EDITOR,
        permissions: mockPermissions,
        status: MembershipStatus.ACTIVE,
        invitedBy: 1,
        joinedAt: new Date(),
      });

      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockPrisma.workspaceMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          permissions: mockPermissions,
        }),
      });
    });

    it("should invalidate workspace cache after joining", async () => {
      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockCacheService.del).toHaveBeenCalledWith(
        "slug:test-workspace",
        { prefix: "workspace" }
      );
    });
  });

  describe("Token Validation", () => {
    it("should reject expired token", async () => {
      const { BadRequestError } = await import("../../errors");
      mockJwt.verify.mockImplementation(() => {
        throw new Error("jwt expired");
      });

      mockReq.body = {
        token: "expired-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
    });

    it("should reject invalid JWT signature", async () => {
      const { BadRequestError } = await import("../../errors");
      mockJwt.verify.mockImplementation(() => {
        throw new Error("invalid signature");
      });

      mockReq.body = {
        token: "invalid-signature-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
    });

    it("should reject token with wrong type", async () => {
      const { BadRequestError } = await import("../../errors");
      mockJwt.verify.mockReturnValue({
        workspaceId: 1,
        workspaceSlug: "test-workspace",
        role: WorkspaceRole.EDITOR,
        type: "workspace_invitation", // Wrong type
        email: "test@example.com",
        createdBy: 1,
      });

      mockReq.body = {
        token: "wrong-type-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
    });

    it("should reject malformed token", async () => {
      const { BadRequestError } = await import("../../errors");
      mockJwt.verify.mockImplementation(() => {
        throw new Error("jwt malformed");
      });

      mockReq.body = {
        token: "malformed.token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
    });
  });

  describe("Membership Validation", () => {
    it("should reject if user is already ACTIVE member", async () => {
      const { ForbiddenError } = await import("../../errors");
      mockPrisma.workspaceMember.findFirst.mockResolvedValue({
        id: 1,
        userId: 2,
        status: MembershipStatus.ACTIVE,
      });

      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ForbiddenError)
      );
    });

    it("should reject if user has PENDING invitation", async () => {
      const { ForbiddenError } = await import("../../errors");
      mockPrisma.workspaceMember.findFirst.mockResolvedValue({
        id: 1,
        userId: 2,
        status: MembershipStatus.PENDING,
      });

      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ForbiddenError)
      );
    });

    it("should properly handle user not found scenario", async () => {
      const { NotFoundError } = await import("../../errors");
      mockPrisma.user.findUnique.mockResolvedValue(null);

      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(NotFoundError)
      );
    });
  });

  describe("Workspace Validation", () => {
    it("should reject when workspace doesn't exist", async () => {
      const { NotFoundError } = await import("../../errors");
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(NotFoundError)
      );
    });
  });

  describe("Member Allocation Limit", () => {
    it("should reject when workspace has reached member limit", async () => {
      const { BadRequestError } = await import("../../errors");

      // Mock workspace count to be at limit (3 for FREE plan)
      mockPrisma.workspaceMember.count.mockResolvedValue(3);

      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Cannot add more members. Workspace member limit reached.",
        })
      );
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should allow joining when workspace has available slots", async () => {
      // Mock workspace count below limit (2 members < 3 limit for FREE plan)
      mockPrisma.workspaceMember.count.mockResolvedValue(2);

      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Successfully joined workspace",
        workspace: expect.any(Object),
      });
    });
  });

  describe("Input Validation", () => {
    it("should reject missing token", async () => {
      const { BadRequestError } = await import("../../errors");

      mockReq.body = {};

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
    });

    it("should reject empty token string", async () => {
      const { BadRequestError } = await import("../../errors");

      mockReq.body = {
        token: "",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(BadRequestError)
      );
    });
  });

  describe("Authentication", () => {
    it("should reject unauthenticated requests", async () => {
      const { UnauthorizedError } = await import("../../errors");

      mockReq.userId = undefined;
      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(UnauthorizedError)
      );
    });
  });

  describe("Cache Error Handling", () => {
    it("should continue operation even if cache invalidation fails", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockCacheService.del.mockRejectedValue(new Error("Cache error"));

      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to invalidate workspace cache:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should log cache errors but not fail the request", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockCacheService.del.mockRejectedValue(new Error("Redis connection failed"));

      mockReq.body = {
        token: "valid-jwt-token",
      };

      await JoinByLinkController.joinByLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Successfully joined workspace",
        workspace: expect.any(Object),
      });
      expect(mockNext).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});