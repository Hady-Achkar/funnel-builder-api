import { describe, it, expect, beforeEach, vi } from "vitest";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { InviteMemberController } from "../../controllers/workspace/invite-member";
import { WorkspaceRole } from "../../generated/prisma-client";

// Mock all dependencies
vi.mock("../../lib/prisma", () => ({
  getPrisma: vi.fn(() => ({
    workspace: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    workspaceRolePermTemplate: {
      findUnique: vi.fn(),
    },
  })),
}));

vi.mock("../../utils/allocations", () => ({
  AllocationService: {
    canAddMember: vi.fn(),
  },
}));

vi.mock("../../helpers/workspace/invite-member", () => ({
  sendWorkspaceInvitationEmail: vi.fn(),
  sendWorkspaceRegisterInvitationEmail: vi.fn(),
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(() => "mock-jwt-token"),
  },
}));

vi.mock("../../helpers/workspace/invite-member/validation", () => ({
  validateWorkspaceExists: vi.fn(),
  validateInviterPermissions: vi.fn(),
  validateMemberAllocationLimit: vi.fn(),
  validateInvitationRequest: vi.fn(),
  checkExistingMembership: vi.fn(),
}));

describe("Workspace Invite Member Controller Tests", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockPrisma: any;
  let mockAllocationService: any;
  let mockValidationHelpers: any;

  beforeEach(async () => {
    const { getPrisma } = await import("../../lib/prisma");
    const { AllocationService } = await import("../../utils/allocations");
    const validationHelpers = await import(
      "../../helpers/workspace/invite-member/validation"
    );

    mockPrisma = getPrisma();
    mockAllocationService = AllocationService;
    mockValidationHelpers = validationHelpers;

    mockReq = {
      userId: 1,
      params: {},
      body: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();

    vi.clearAllMocks();

    // Set up default successful mocks
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.workspaceMember.create.mockResolvedValue(undefined);
    mockPrisma.workspaceRolePermTemplate.findUnique.mockResolvedValue({
      permissions: [],
    });
    mockAllocationService.canAddMember.mockResolvedValue(true);

    mockValidationHelpers.validateWorkspaceExists.mockResolvedValue(undefined);
    mockValidationHelpers.validateInviterPermissions.mockResolvedValue(undefined);
    mockValidationHelpers.validateMemberAllocationLimit.mockResolvedValue(undefined);
    mockValidationHelpers.validateInvitationRequest.mockResolvedValue(undefined);
    mockValidationHelpers.checkExistingMembership.mockResolvedValue(undefined);
  });

  describe("Successful Invitations", () => {
    it("should successfully invite a new user", async () => {
      const workspace = {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: 1,
        members: [],
        owner: { id: 1, firstName: "John", lastName: "Doe" },
      };

      mockValidationHelpers.validateWorkspaceExists.mockResolvedValue(workspace);

      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };
      mockReq.body = {
        email: "test@example.com",
        role: WorkspaceRole.EDITOR,
      };

      await InviteMemberController.inviteMember(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Member invited successfully",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Input Validation Errors", () => {
    it("should handle workspace not found error", async () => {
      const { NotFoundError } = await import("../../errors");
      mockValidationHelpers.validateWorkspaceExists.mockRejectedValue(
        new NotFoundError("Workspace not found")
      );

      mockReq.userId = 1;
      mockReq.params = { slug: "non-existent" };
      mockReq.body = {
        email: "test@example.com",
        role: WorkspaceRole.EDITOR,
      };

      await InviteMemberController.inviteMember(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Workspace not found" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should reject invalid email formats", async () => {
      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };
      mockReq.body = {
        email: "invalid-email",
        role: WorkspaceRole.EDITOR,
      };

      await InviteMemberController.inviteMember(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Please provide a valid email address" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should handle missing user ID", async () => {
      mockReq.userId = undefined;
      mockReq.params = { slug: "test-workspace" };
      mockReq.body = {
        email: "test@example.com",
        role: WorkspaceRole.EDITOR,
      };

      await InviteMemberController.inviteMember(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("Business Rule Violations", () => {
    it("should prevent inviting a user who is already a member", async () => {
      const { InviteMemberService } = await import("../../services/workspace/invite-member");
      const { BadRequestError } = await import("../../errors");

      const serviceSpy = vi.spyOn(InviteMemberService, 'inviteMember').mockRejectedValue(
        new BadRequestError("User is already a member of this workspace")
      );

      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };
      mockReq.body = {
        email: "existing@example.com",
        role: WorkspaceRole.EDITOR,
      };

      await InviteMemberController.inviteMember(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User is already a member of this workspace",
        })
      );
      expect(mockRes.json).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });

    it("should prevent inviting when workspace member limit is reached", async () => {
      const { InviteMemberService } = await import("../../services/workspace/invite-member");
      const { BadRequestError } = await import("../../errors");

      const serviceSpy = vi.spyOn(InviteMemberService, 'inviteMember').mockRejectedValue(
        new BadRequestError("Cannot add more members. Workspace member limit reached.")
      );

      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };
      mockReq.body = {
        email: "newuser@example.com",
        role: WorkspaceRole.EDITOR,
      };

      await InviteMemberController.inviteMember(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Cannot add more members. Workspace member limit reached.",
        })
      );
      expect(mockRes.json).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });

    it("should prevent workspace owner from being invited as member", async () => {
      const { InviteMemberService } = await import("../../services/workspace/invite-member");
      const { BadRequestError } = await import("../../errors");

      const serviceSpy = vi.spyOn(InviteMemberService, 'inviteMember').mockRejectedValue(
        new BadRequestError("Cannot invite the workspace owner as a member")
      );

      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };
      mockReq.body = {
        email: "owner@example.com",
        role: WorkspaceRole.EDITOR,
      };

      await InviteMemberController.inviteMember(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Cannot invite the workspace owner as a member",
        })
      );
      expect(mockRes.json).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });
  });

  describe("Permission Errors", () => {
    it("should prevent non-members from inviting", async () => {
      const { InviteMemberService } = await import("../../services/workspace/invite-member");
      const { ForbiddenError } = await import("../../errors");

      const serviceSpy = vi.spyOn(InviteMemberService, 'inviteMember').mockRejectedValue(
        new ForbiddenError("You are not a member of this workspace")
      );

      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };
      mockReq.body = {
        email: "newuser@example.com",
        role: WorkspaceRole.EDITOR,
      };

      await InviteMemberController.inviteMember(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You are not a member of this workspace",
        })
      );
      expect(mockRes.json).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });

    it("should prevent members without invite permission from inviting", async () => {
      const { InviteMemberService } = await import("../../services/workspace/invite-member");
      const { ForbiddenError } = await import("../../errors");

      const serviceSpy = vi.spyOn(InviteMemberService, 'inviteMember').mockRejectedValue(
        new ForbiddenError("You don't have permission to invite members")
      );

      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };
      mockReq.body = {
        email: "newuser@example.com",
        role: WorkspaceRole.EDITOR,
      };

      await InviteMemberController.inviteMember(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You don't have permission to invite members",
        })
      );
      expect(mockRes.json).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });
  });
});