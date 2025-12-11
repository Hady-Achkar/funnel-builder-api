import { describe, it, expect, beforeEach, vi } from "vitest";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { InviteMemberController } from "../../controllers/workspace/invite-member";
import { WorkspaceRole, MembershipStatus } from "../../generated/prisma-client";

// Create a single mocked prisma instance that will be reused
const mockPrismaInstance = {
  workspace: {
    findUnique: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  workspaceMember: {
    findUnique: vi.fn(),
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

vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(() => "mock-jwt-token"),
  },
}));

vi.mock("../../utils/workspace-utils/workspace-permission-manager", () => ({
  PermissionManager: {
    requirePermission: vi.fn(),
  },
}));

describe("Workspace Invite Member Controller Tests", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockPrisma: any;
  let mockPermissionManager: any;

  beforeEach(async () => {
    const permissionManager = await import(
      "../../utils/workspace-utils/workspace-permission-manager"
    );

    mockPrisma = mockPrismaInstance;
    mockPermissionManager = permissionManager.PermissionManager;

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
    mockPrisma.workspace.findUnique.mockResolvedValue({
      id: 1,
      planType: "FREE",
      addOns: [],
    });
    mockPrisma.workspaceMember.count.mockResolvedValue(0); // No members yet
    mockPrisma.workspaceMember.findFirst.mockResolvedValue(null); // No existing invitation
    mockPrisma.workspaceMember.create.mockResolvedValue({
      id: 1,
      status: MembershipStatus.PENDING,
      email: "test@example.com",
      role: WorkspaceRole.EDITOR,
    });
    mockPrisma.workspaceRolePermTemplate.findUnique.mockResolvedValue({
      permissions: [],
    });

    mockPrisma.workspace.findUnique.mockResolvedValue({
      id: 1,
      name: "Test Workspace",
      slug: "test-workspace",
      ownerId: 1,
      members: [],
      owner: { id: 1, firstName: "John", lastName: "Doe" },
    });
    mockPermissionManager.requirePermission.mockResolvedValue(undefined);
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

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);

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

    it("should create pending membership for existing user", async () => {
      const workspace = {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: 1,
        members: [],
        owner: { id: 1, firstName: "John", lastName: "Doe" },
      };

      const existingUser = {
        id: 2,
        email: "existing@example.com",
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

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

      expect(mockPrisma.workspaceMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 2,
          email: "existing@example.com",
          workspaceId: 1,
          role: WorkspaceRole.EDITOR,
          status: MembershipStatus.PENDING,
          invitedBy: 1,
        }),
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should create pending membership for non-existing user", async () => {
      const workspace = {
        id: 1,
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: 1,
        members: [],
        owner: { id: 1, firstName: "John", lastName: "Doe" },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
      mockPrisma.user.findUnique.mockResolvedValue(null); // User doesn't exist

      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };
      mockReq.body = {
        email: "newuser@example.com",
        role: WorkspaceRole.VIEWER,
      };

      await InviteMemberController.inviteMember(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockPrisma.workspaceMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
          email: "newuser@example.com",
          workspaceId: 1,
          role: WorkspaceRole.VIEWER,
          status: MembershipStatus.PENDING,
          invitedBy: 1,
        }),
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Input Validation Errors", () => {
    it("should handle workspace not found error", async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

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
        expect.objectContaining({
          message: "Please provide a valid email address",
        })
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

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication required",
        })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe("Business Rule Violations", () => {
    it("should prevent inviting a user who is already a member", async () => {
      const { InviteMemberService } = await import(
        "../../services/workspace/invite-member"
      );
      const { BadRequestError } = await import("../../errors");

      const serviceSpy = vi
        .spyOn(InviteMemberService, "inviteMember")
        .mockRejectedValue(
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

    it("should prevent inviting the same email twice with user-friendly message", async () => {
      const { InviteMemberService } = await import(
        "../../services/workspace/invite-member"
      );
      const { BadRequestError } = await import("../../errors");

      const serviceSpy = vi
        .spyOn(InviteMemberService, "inviteMember")
        .mockRejectedValue(
          new BadRequestError(
            "This email has already been invited to the workspace"
          )
        );

      mockReq.userId = 1;
      mockReq.params = { slug: "test-workspace" };
      mockReq.body = {
        email: "duplicate@example.com",
        role: WorkspaceRole.EDITOR,
      };

      await InviteMemberController.inviteMember(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "This email has already been invited to the workspace",
        })
      );
      expect(mockRes.json).not.toHaveBeenCalled();

      serviceSpy.mockRestore();
    });

    it("should prevent inviting when workspace member limit is reached", async () => {
      const { InviteMemberService } = await import(
        "../../services/workspace/invite-member"
      );
      const { BadRequestError } = await import("../../errors");

      const serviceSpy = vi
        .spyOn(InviteMemberService, "inviteMember")
        .mockRejectedValue(
          new BadRequestError(
            "Cannot add more members. Workspace member limit reached."
          )
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
      const { InviteMemberService } = await import(
        "../../services/workspace/invite-member"
      );
      const { BadRequestError } = await import("../../errors");

      const serviceSpy = vi
        .spyOn(InviteMemberService, "inviteMember")
        .mockRejectedValue(
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
      const { InviteMemberService } = await import(
        "../../services/workspace/invite-member"
      );
      const { ForbiddenError } = await import("../../errors");

      const serviceSpy = vi
        .spyOn(InviteMemberService, "inviteMember")
        .mockRejectedValue(
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
      const { InviteMemberService } = await import(
        "../../services/workspace/invite-member"
      );
      const { ForbiddenError } = await import("../../errors");

      const serviceSpy = vi
        .spyOn(InviteMemberService, "inviteMember")
        .mockRejectedValue(
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
