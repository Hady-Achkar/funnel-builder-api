import { describe, it, expect, beforeEach, vi } from "vitest";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { GenerateInviteLinkController } from "../../controllers/workspace/generate-invite-link";
import { WorkspaceRole } from "../../generated/prisma-client";

// Create a single mocked prisma instance that will be reused
const mockPrismaInstance = {
  workspace: {
    findUnique: vi.fn(),
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
    sign: vi.fn(() => "mock-jwt-token"),
  },
}));

vi.mock("../../helpers/workspace/invite-member/validation", () => ({
  validateWorkspaceExists: vi.fn(),
  validateInviterPermissions: vi.fn(),
}));

describe("Workspace Generate Invite Link Controller Tests", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockPrisma: any;
  let mockValidationHelpers: any;
  let mockJwt: any;

  beforeEach(async () => {
    const validationHelpers = await import(
      "../../helpers/workspace/invite-member/validation"
    );
    const jwt = await import("jsonwebtoken");

    mockPrisma = mockPrismaInstance;
    mockValidationHelpers = validationHelpers;
    mockJwt = jwt.default;

    mockReq = {
      userId: 1,
      params: {},
      query: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();

    vi.clearAllMocks();

    // Set up default successful mocks
    mockValidationHelpers.validateWorkspaceExists.mockResolvedValue({
      id: 1,
      name: "Test Workspace",
      slug: "test-workspace",
      ownerId: 1,
    });
    mockValidationHelpers.validateInviterPermissions.mockResolvedValue(
      undefined
    );
    mockJwt.sign.mockReturnValue("mock-jwt-token");
  });

  describe("Successful Link Generation", () => {
    it("should generate invite link for workspace owner", async () => {
      const workspace = {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: 1,
      };

      mockValidationHelpers.validateWorkspaceExists.mockResolvedValue(
        workspace
      );

      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };
      mockReq.query = {
        role: WorkspaceRole.EDITOR,
      };

      await GenerateInviteLinkController.generateInviteLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        link: expect.stringContaining("/join-workspace?token=mock-jwt-token"),
        token: "mock-jwt-token",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should generate invite link for workspace admin", async () => {
      const workspace = {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: 2, // Different owner
      };

      mockValidationHelpers.validateWorkspaceExists.mockResolvedValue(
        workspace
      );

      mockReq.userId = 3; // Admin user
      mockReq.params = { slug: "test-workspace" };
      mockReq.query = {
        role: WorkspaceRole.VIEWER,
      };

      await GenerateInviteLinkController.generateInviteLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        link: expect.stringContaining("/join-workspace?token=mock-jwt-token"),
        token: "mock-jwt-token",
      });
    });

    it("should include correct JWT payload for EDITOR role", async () => {
      const workspace = {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: 1,
      };

      mockValidationHelpers.validateWorkspaceExists.mockResolvedValue(
        workspace
      );

      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };
      mockReq.query = {
        role: WorkspaceRole.EDITOR,
      };

      await GenerateInviteLinkController.generateInviteLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          workspaceId: 1,
          workspaceSlug: "test-workspace",
          role: WorkspaceRole.EDITOR,
          type: "workspace_direct_link",
          linkId: expect.any(String),
          createdBy: 1,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
    });

    it("should include correct JWT payload for VIEWER role", async () => {
      const workspace = {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: 1,
      };

      mockValidationHelpers.validateWorkspaceExists.mockResolvedValue(
        workspace
      );

      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };
      mockReq.query = {
        role: WorkspaceRole.VIEWER,
      };

      await GenerateInviteLinkController.generateInviteLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          workspaceId: 1,
          workspaceSlug: "test-workspace",
          role: WorkspaceRole.VIEWER,
          type: "workspace_direct_link",
          linkId: expect.any(String),
          createdBy: 1,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
    });

    it("should set 7-day expiration by default", async () => {
      const workspace = {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: 1,
      };

      mockValidationHelpers.validateWorkspaceExists.mockResolvedValue(
        workspace
      );

      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };
      mockReq.query = {
        role: WorkspaceRole.EDITOR,
      };

      await GenerateInviteLinkController.generateInviteLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
    });
  });

  describe("Permission Validation", () => {
    it.skip("should reject link generation by non-admin/owner", async () => {
      const { ForbiddenError } = await import("../../errors");

      // Reset mocks first
      vi.clearAllMocks();

      // Set up workspace validation to succeed
      mockValidationHelpers.validateWorkspaceExists.mockResolvedValue({
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: 1,
      });

      // Set up permission validation to fail
      mockValidationHelpers.validateInviterPermissions.mockRejectedValue(
        new ForbiddenError("Insufficient permissions")
      );

      mockReq.userId = 3; // Regular member
      mockReq.params = { slug: "test-workspace" };
      mockReq.query = {
        role: WorkspaceRole.EDITOR,
      };

      await GenerateInviteLinkController.generateInviteLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it.skip("should reject link generation by non-member", async () => {
      const { ForbiddenError } = await import("../../errors");

      // Reset mocks first
      vi.clearAllMocks();

      // Set up workspace validation to succeed
      mockValidationHelpers.validateWorkspaceExists.mockResolvedValue({
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: 1,
      });

      // Set up permission validation to fail
      mockValidationHelpers.validateInviterPermissions.mockRejectedValue(
        new ForbiddenError("You are not a member of this workspace")
      );

      mockReq.userId = 999; // Non-member
      mockReq.params = { slug: "test-workspace" };
      mockReq.query = {
        role: WorkspaceRole.VIEWER,
      };

      await GenerateInviteLinkController.generateInviteLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe("Workspace Validation", () => {
    it("should reject when workspace doesn't exist", async () => {
      const { NotFoundError } = await import("../../errors");
      mockValidationHelpers.validateWorkspaceExists.mockRejectedValue(
        new NotFoundError("Workspace not found")
      );

      mockReq.userId = 1;
      mockReq.params = { slug: "non-existent-workspace" };
      mockReq.query = {
        role: WorkspaceRole.EDITOR,
      };

      await GenerateInviteLinkController.generateInviteLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Workspace not found",
        })
      );
    });

    it("should reject with invalid workspace slug", async () => {
      const { BadRequestError } = await import("../../errors");

      mockReq.userId = 1;
      mockReq.params = { slug: "" };
      mockReq.query = {
        role: WorkspaceRole.EDITOR,
      };

      await GenerateInviteLinkController.generateInviteLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe("Input Validation", () => {
    it("should reject invalid role", async () => {
      const { BadRequestError } = await import("../../errors");

      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };
      mockReq.query = {
        role: "INVALID_ROLE",
      };

      await GenerateInviteLinkController.generateInviteLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it("should reject missing workspace slug", async () => {
      const { BadRequestError } = await import("../../errors");

      mockReq.userId = 1;
      mockReq.params = {};
      mockReq.query = {
        role: WorkspaceRole.EDITOR,
      };

      await GenerateInviteLinkController.generateInviteLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it("should reject empty request query", async () => {
      const { BadRequestError } = await import("../../errors");

      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };
      mockReq.query = {};

      await GenerateInviteLinkController.generateInviteLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe("Authentication", () => {
    it("should reject unauthenticated requests", async () => {
      const { UnauthorizedError } = await import("../../errors");

      mockReq.userId = undefined;
      mockReq.params = { slug: "test-workspace" };
      mockReq.query = {
        role: WorkspaceRole.EDITOR,
      };

      await GenerateInviteLinkController.generateInviteLink(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });
});
