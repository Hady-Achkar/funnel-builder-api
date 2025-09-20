import { describe, it, expect, beforeEach, vi } from "vitest";
import { InviteMemberService } from "../../services/workspace/invite-member";
import { InviteMemberController } from "../../controllers/workspace/invite-member";
import { getPrisma } from "../../lib/prisma";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../errors";
import { WorkspaceRole, WorkspacePermission } from "../../generated/prisma-client";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";

// Mock the prisma client
vi.mock("../../lib/prisma");

// Mock WorkspacePermissions helper
vi.mock("../../helpers/workspace-permissions", () => ({
  WorkspacePermissions: {
    canInviteMembers: vi.fn(),
  },
}));

import { WorkspacePermissions } from "../../helpers/workspace-permissions";

describe("Workspace Invite Member Tests", () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      workspace: {
        findUnique: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  describe("InviteMemberService", () => {
    describe("Permission Checks", () => {
      it("should allow owner to invite members", async () => {
        const inviterUserId = 1;
        const requestData = {
          workspaceSlug: "test-workspace",
          email: "newmember@example.com",
          role: WorkspaceRole.EDITOR,
          permissions: [WorkspacePermission.EDIT_FUNNELS],
        };

        const workspace = {
          id: 1,
          slug: "test-workspace",
          ownerId: inviterUserId,
          members: [],
        };

        const userToInvite = {
          id: 10,
          email: "newmember@example.com",
        };

        const createdMember = {
          id: 1,
          userId: 10,
          workspaceId: 1,
          role: WorkspaceRole.EDITOR,
          permissions: [WorkspacePermission.EDIT_FUNNELS],
          joinedAt: new Date(),
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
        mockPrisma.user.findUnique.mockResolvedValue(userToInvite);
        mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
        mockPrisma.workspaceMember.create.mockResolvedValue(createdMember);

        const result = await InviteMemberService.inviteMember(
          inviterUserId,
          requestData
        );

        expect(result.message).toBe("Member invited successfully");
        expect(result.member.userId).toBe(10);
        expect(result.member.role).toBe(WorkspaceRole.EDITOR);
        expect(mockPrisma.workspaceMember.create).toHaveBeenCalledWith({
          data: {
            userId: 10,
            workspaceId: 1,
            role: WorkspaceRole.EDITOR,
            permissions: [WorkspacePermission.EDIT_FUNNELS],
          },
        });
      });

      it("should allow admin members to invite if they have permission", async () => {
        const inviterUserId = 2;
        const requestData = {
          workspaceSlug: "test-workspace",
          email: "newmember@example.com",
          role: WorkspaceRole.VIEWER,
        };

        const workspace = {
          id: 1,
          slug: "test-workspace",
          ownerId: 1,
          members: [
            {
              id: 1,
              userId: inviterUserId,
              role: WorkspaceRole.ADMIN,
              permissions: [WorkspacePermission.MANAGE_MEMBERS],
              user: {
                id: inviterUserId,
                email: "admin@example.com",
              },
            },
          ],
        };

        const userToInvite = {
          id: 10,
          email: "newmember@example.com",
        };

        const createdMember = {
          id: 2,
          userId: 10,
          workspaceId: 1,
          role: WorkspaceRole.VIEWER,
          permissions: [],
          joinedAt: new Date(),
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
        mockPrisma.user.findUnique.mockResolvedValue(userToInvite);
        mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
        mockPrisma.workspaceMember.create.mockResolvedValue(createdMember);

        // Mock permission check to return true for admin
        (WorkspacePermissions.canInviteMembers as any).mockReturnValue(true);

        const result = await InviteMemberService.inviteMember(
          inviterUserId,
          requestData
        );

        expect(result.message).toBe("Member invited successfully");
        expect(result.member.role).toBe(WorkspaceRole.VIEWER);
        expect(WorkspacePermissions.canInviteMembers).toHaveBeenCalledWith({
          role: WorkspaceRole.ADMIN,
          permissions: [WorkspacePermission.MANAGE_MEMBERS],
        });
      });

      it("should reject invites from members without permission", async () => {
        const inviterUserId = 2;
        const requestData = {
          workspaceSlug: "test-workspace",
          email: "newmember@example.com",
          role: WorkspaceRole.EDITOR,
        };

        const workspace = {
          id: 1,
          slug: "test-workspace",
          ownerId: 1,
          members: [
            {
              id: 1,
              userId: inviterUserId,
              role: WorkspaceRole.EDITOR,
              permissions: [WorkspacePermission.EDIT_FUNNELS],
              user: {
                id: inviterUserId,
                email: "editor@example.com",
              },
            },
          ],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspace);

        // Mock permission check to return false
        (WorkspacePermissions.canInviteMembers as any).mockReturnValue(false);

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow(ForbiddenError);

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow("You don't have permission to invite members");
      });

      it("should reject invites from non-members", async () => {
        const inviterUserId = 999;
        const requestData = {
          workspaceSlug: "test-workspace",
          email: "newmember@example.com",
          role: WorkspaceRole.EDITOR,
        };

        const workspace = {
          id: 1,
          slug: "test-workspace",
          ownerId: 1,
          members: [],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspace);

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow(ForbiddenError);

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow("You are not a member of this workspace");
      });
    });

    describe("Validation Checks", () => {
      it("should reject inviting non-existent users", async () => {
        const inviterUserId = 1;
        const requestData = {
          workspaceSlug: "test-workspace",
          email: "nonexistent@example.com",
          role: WorkspaceRole.EDITOR,
        };

        const workspace = {
          id: 1,
          slug: "test-workspace",
          ownerId: inviterUserId,
          members: [],
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow(NotFoundError);

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow("User with this email does not exist");
      });

      it("should reject inviting users who are already members", async () => {
        const inviterUserId = 1;
        const requestData = {
          workspaceSlug: "test-workspace",
          email: "existing@example.com",
          role: WorkspaceRole.EDITOR,
        };

        const workspace = {
          id: 1,
          slug: "test-workspace",
          ownerId: inviterUserId,
          members: [],
        };

        const existingUser = {
          id: 10,
          email: "existing@example.com",
        };

        const existingMember = {
          id: 1,
          userId: 10,
          workspaceId: 1,
          role: WorkspaceRole.VIEWER,
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
        mockPrisma.user.findUnique.mockResolvedValue(existingUser);
        mockPrisma.workspaceMember.findUnique.mockResolvedValue(existingMember);

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow(BadRequestError);

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow("User is already a member of this workspace");
      });

      it("should reject inviting the workspace owner as a member", async () => {
        const inviterUserId = 2; // Admin trying to invite
        const requestData = {
          workspaceSlug: "test-workspace",
          email: "owner@example.com",
          role: WorkspaceRole.EDITOR,
        };

        const workspace = {
          id: 1,
          slug: "test-workspace",
          ownerId: 1,
          members: [
            {
              id: 1,
              userId: inviterUserId,
              role: WorkspaceRole.ADMIN,
              permissions: [WorkspacePermission.MANAGE_MEMBERS],
              user: {
                id: inviterUserId,
                email: "admin@example.com",
              },
            },
          ],
        };

        const ownerUser = {
          id: 1, // Same as workspace.ownerId
          email: "owner@example.com",
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
        mockPrisma.user.findUnique.mockResolvedValue(ownerUser);
        (WorkspacePermissions.canInviteMembers as any).mockReturnValue(true);

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow(BadRequestError);

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow("Cannot invite the workspace owner as a member");
      });

      it("should reject invalid email formats", async () => {
        const inviterUserId = 1;
        const requestData = {
          workspaceSlug: "test-workspace",
          email: "invalid-email",
          role: WorkspaceRole.EDITOR,
        };

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow(BadRequestError);

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow("Invalid request data");
      });

      it("should reject invalid roles", async () => {
        const inviterUserId = 1;
        const requestData = {
          workspaceSlug: "test-workspace",
          email: "user@example.com",
          role: "INVALID_ROLE",
        };

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow(BadRequestError);

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow("Invalid request data");
      });

      it("should reject when workspace doesn't exist", async () => {
        const inviterUserId = 1;
        const requestData = {
          workspaceSlug: "non-existent",
          email: "user@example.com",
          role: WorkspaceRole.EDITOR,
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(null);

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow(NotFoundError);

        await expect(
          InviteMemberService.inviteMember(inviterUserId, requestData)
        ).rejects.toThrow("Workspace not found");
      });
    });

    describe("Different Role Invitations", () => {
      it("should invite member with VIEWER role", async () => {
        const inviterUserId = 1;
        const requestData = {
          workspaceSlug: "test-workspace",
          email: "viewer@example.com",
          role: WorkspaceRole.VIEWER,
        };

        const workspace = {
          id: 1,
          slug: "test-workspace",
          ownerId: inviterUserId,
          members: [],
        };

        const userToInvite = {
          id: 10,
          email: "viewer@example.com",
        };

        const createdMember = {
          id: 1,
          userId: 10,
          workspaceId: 1,
          role: WorkspaceRole.VIEWER,
          permissions: [],
          joinedAt: new Date(),
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
        mockPrisma.user.findUnique.mockResolvedValue(userToInvite);
        mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
        mockPrisma.workspaceMember.create.mockResolvedValue(createdMember);

        const result = await InviteMemberService.inviteMember(
          inviterUserId,
          requestData
        );

        expect(result.member.role).toBe(WorkspaceRole.VIEWER);
        expect(result.member.permissions).toEqual([]);
      });

      it("should invite member with EDITOR role and custom permissions", async () => {
        const inviterUserId = 1;
        const requestData = {
          workspaceSlug: "test-workspace",
          email: "editor@example.com",
          role: WorkspaceRole.EDITOR,
          permissions: [
            WorkspacePermission.CREATE_FUNNELS,
            WorkspacePermission.EDIT_FUNNELS,
            WorkspacePermission.VIEW_ANALYTICS,
          ],
        };

        const workspace = {
          id: 1,
          slug: "test-workspace",
          ownerId: inviterUserId,
          members: [],
        };

        const userToInvite = {
          id: 10,
          email: "editor@example.com",
        };

        const createdMember = {
          id: 1,
          userId: 10,
          workspaceId: 1,
          role: WorkspaceRole.EDITOR,
          permissions: requestData.permissions,
          joinedAt: new Date(),
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
        mockPrisma.user.findUnique.mockResolvedValue(userToInvite);
        mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
        mockPrisma.workspaceMember.create.mockResolvedValue(createdMember);

        const result = await InviteMemberService.inviteMember(
          inviterUserId,
          requestData
        );

        expect(result.member.role).toBe(WorkspaceRole.EDITOR);
        expect(result.member.permissions).toEqual([
          WorkspacePermission.CREATE_FUNNELS,
          WorkspacePermission.EDIT_FUNNELS,
          WorkspacePermission.VIEW_ANALYTICS,
        ]);
      });

      it("should invite member with ADMIN role", async () => {
        const inviterUserId = 1;
        const requestData = {
          workspaceSlug: "test-workspace",
          email: "admin@example.com",
          role: WorkspaceRole.ADMIN,
          permissions: [
            WorkspacePermission.MANAGE_WORKSPACE,
            WorkspacePermission.MANAGE_MEMBERS,
          ],
        };

        const workspace = {
          id: 1,
          slug: "test-workspace",
          ownerId: inviterUserId,
          members: [],
        };

        const userToInvite = {
          id: 10,
          email: "admin@example.com",
        };

        const createdMember = {
          id: 1,
          userId: 10,
          workspaceId: 1,
          role: WorkspaceRole.ADMIN,
          permissions: requestData.permissions,
          joinedAt: new Date(),
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
        mockPrisma.user.findUnique.mockResolvedValue(userToInvite);
        mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
        mockPrisma.workspaceMember.create.mockResolvedValue(createdMember);

        const result = await InviteMemberService.inviteMember(
          inviterUserId,
          requestData
        );

        expect(result.member.role).toBe(WorkspaceRole.ADMIN);
        expect(result.member.permissions).toContain(
          WorkspacePermission.MANAGE_WORKSPACE
        );
        expect(result.member.permissions).toContain(
          WorkspacePermission.MANAGE_MEMBERS
        );
      });

      it("should use empty permissions array when not provided", async () => {
        const inviterUserId = 1;
        const requestData = {
          workspaceSlug: "test-workspace",
          email: "member@example.com",
          role: WorkspaceRole.EDITOR,
          // No permissions field
        };

        const workspace = {
          id: 1,
          slug: "test-workspace",
          ownerId: inviterUserId,
          members: [],
        };

        const userToInvite = {
          id: 10,
          email: "member@example.com",
        };

        const createdMember = {
          id: 1,
          userId: 10,
          workspaceId: 1,
          role: WorkspaceRole.EDITOR,
          permissions: [],
          joinedAt: new Date(),
        };

        mockPrisma.workspace.findUnique.mockResolvedValue(workspace);
        mockPrisma.user.findUnique.mockResolvedValue(userToInvite);
        mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
        mockPrisma.workspaceMember.create.mockResolvedValue(createdMember);

        const result = await InviteMemberService.inviteMember(
          inviterUserId,
          requestData
        );

        expect(mockPrisma.workspaceMember.create).toHaveBeenCalledWith({
          data: {
            userId: 10,
            workspaceId: 1,
            role: WorkspaceRole.EDITOR,
            permissions: [],
          },
        });
        expect(result.member.permissions).toEqual([]);
      });
    });
  });

  describe("InviteMemberController", () => {
    it("should return 200 on successful invitation", async () => {
      const mockReq = {
        userId: 1,
        params: { slug: "test-workspace" },
        body: {
          email: "newmember@example.com",
          role: WorkspaceRole.EDITOR,
        },
      } as unknown as AuthRequest;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as unknown as NextFunction;

      const mockResult = {
        message: "Member invited successfully",
        member: {
          id: 1,
          userId: 10,
          workspaceId: 1,
          role: WorkspaceRole.EDITOR,
          permissions: [],
          joinedAt: new Date(),
        },
      };

      vi.spyOn(InviteMemberService, "inviteMember").mockResolvedValue(mockResult);

      await InviteMemberController.inviteMember(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
      expect(InviteMemberService.inviteMember).toHaveBeenCalledWith(1, {
        workspaceSlug: "test-workspace",
        email: "newmember@example.com",
        role: WorkspaceRole.EDITOR,
      });
    });

    it("should pass errors to next middleware", async () => {
      const mockReq = {
        userId: 1,
        params: { slug: "test-workspace" },
        body: {
          email: "invalid@example.com",
          role: WorkspaceRole.EDITOR,
        },
      } as unknown as AuthRequest;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as unknown as NextFunction;

      const error = new NotFoundError("User not found");
      vi.spyOn(InviteMemberService, "inviteMember").mockRejectedValue(error);

      await InviteMemberController.inviteMember(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should handle missing userId gracefully", async () => {
      const mockReq = {
        userId: undefined,
        params: { slug: "test-workspace" },
        body: {
          email: "user@example.com",
          role: WorkspaceRole.EDITOR,
        },
      } as unknown as AuthRequest;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as unknown as NextFunction;

      const error = new Error("User ID is undefined");
      vi.spyOn(InviteMemberService, "inviteMember").mockRejectedValue(error);

      await InviteMemberController.inviteMember(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should correctly format request data with workspace slug from params", async () => {
      const mockReq = {
        userId: 1,
        params: { slug: "my-workspace-slug" },
        body: {
          email: "user@example.com",
          role: WorkspaceRole.VIEWER,
          permissions: [WorkspacePermission.VIEW_ANALYTICS],
        },
      } as unknown as AuthRequest;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as unknown as NextFunction;

      const mockResult = {
        message: "Member invited successfully",
        member: {
          id: 1,
          userId: 10,
          workspaceId: 1,
          role: WorkspaceRole.VIEWER,
          permissions: [WorkspacePermission.VIEW_ANALYTICS],
          joinedAt: new Date(),
        },
      };

      vi.spyOn(InviteMemberService, "inviteMember").mockResolvedValue(mockResult);

      await InviteMemberController.inviteMember(mockReq, mockRes, mockNext);

      expect(InviteMemberService.inviteMember).toHaveBeenCalledWith(1, {
        workspaceSlug: "my-workspace-slug",
        email: "user@example.com",
        role: WorkspaceRole.VIEWER,
        permissions: [WorkspacePermission.VIEW_ANALYTICS],
      });
    });
  });
});