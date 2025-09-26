import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth";
import { AcceptInvitationController } from "../../controllers/workspace/accept-invitation";
import { WorkspaceRole, WorkspacePermission, MembershipStatus, UserPlan, PrismaClient } from "../../generated/prisma-client";
import { getPrisma, setPrismaClient } from "../../lib/prisma";
import jwt from "jsonwebtoken";

describe("Workspace Accept Invitation Integration Tests", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let testWorkspaceId: number;
  let testUserId: number;
  let inviterUserId: number;
  let invitationToken: string;
  let prisma: PrismaClient;

  beforeEach(async () => {
    // Set up test database
    prisma = new PrismaClient();
    setPrismaClient(prisma);

    // Create test users
    const inviter = await prisma.user.create({
      data: {
        email: "inviter@test.com",
        username: "inviter",
        firstName: "Inviter",
        lastName: "User",
        password: "hashedpassword",
        plan: UserPlan.BUSINESS,
        maximumWorkspaces: 3,
        maximumAdmins: 5,
      },
    });
    inviterUserId = inviter.id;

    const invitee = await prisma.user.create({
      data: {
        email: "invitee@test.com",
        username: "invitee",
        firstName: "Invitee",
        lastName: "User",
        password: "hashedpassword",
        plan: UserPlan.FREE,
      },
    });
    testUserId = invitee.id;

    // Create test workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: inviterUserId,
        description: "Test workspace for invitation",
      },
    });
    testWorkspaceId = workspace.id;

    // Create workspace member for owner
    await prisma.workspaceMember.create({
      data: {
        userId: inviterUserId,
        workspaceId: testWorkspaceId,
        role: WorkspaceRole.OWNER,
        permissions: Object.values(WorkspacePermission),
        status: MembershipStatus.ACTIVE,
      },
    });

    // Create role permission template
    await prisma.workspaceRolePermTemplate.create({
      data: {
        workspaceId: testWorkspaceId,
        role: WorkspaceRole.EDITOR,
        permissions: [WorkspacePermission.CREATE_FUNNELS, WorkspacePermission.EDIT_FUNNELS],
      },
    });

    // Generate real invitation token
    invitationToken = jwt.sign(
      {
        workspaceId: testWorkspaceId,
        workspaceSlug: "test-workspace",
        role: WorkspaceRole.EDITOR,
        email: "invitee@test.com",
        type: "workspace_invitation",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    mockReq = {
      userId: testUserId,
      body: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: testWorkspaceId },
    });
    await prisma.workspaceRolePermTemplate.deleteMany({
      where: { workspaceId: testWorkspaceId },
    });
    await prisma.workspace.deleteMany({
      where: { id: testWorkspaceId },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUserId, inviterUserId] } },
    });

    // Disconnect Prisma client
    await prisma.$disconnect();
  });

  describe("Input Validation Errors", () => {
    it("should reject missing token", async () => {
      mockReq.body = {};

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid input: expected string, received undefined" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should reject empty token", async () => {
      mockReq.body = { token: "" };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Token is required" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe("Token and Authentication Errors", () => {
    it("should reject invalid token", async () => {
      mockReq.body = { token: "invalid-token" };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid or expired invitation token" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should reject token for different email", async () => {
      // Create token for different email
      const wrongEmailToken = jwt.sign(
        {
          workspaceId: testWorkspaceId,
          workspaceSlug: "test-workspace",
          role: WorkspaceRole.EDITOR,
          email: "different@test.com",
          type: "workspace_invitation",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      mockReq.body = { token: wrongEmailToken };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "This invitation is not for your email address" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should reject wrong token type", async () => {
      const wrongTypeToken = jwt.sign(
        {
          workspaceId: testWorkspaceId,
          workspaceSlug: "test-workspace",
          role: WorkspaceRole.EDITOR,
          email: "invitee@test.com",
          type: "password_reset",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      mockReq.body = { token: wrongTypeToken };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid invitation token type" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe("Successful Invitation Acceptance Flow", () => {
    it("should successfully accept pending invitation and update status to ACTIVE", async () => {
      const prisma = getPrisma();

      // Create pending invitation
      await prisma.workspaceMember.create({
        data: {
          userId: testUserId,
          email: "invitee@test.com",
          workspaceId: testWorkspaceId,
          role: WorkspaceRole.EDITOR,
          permissions: [WorkspacePermission.CREATE_FUNNELS, WorkspacePermission.EDIT_FUNNELS],
          status: MembershipStatus.PENDING,
          invitedBy: inviterUserId,
        },
      });

      mockReq.body = { token: invitationToken };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Invitation accepted successfully",
        workspace: {
          id: testWorkspaceId,
          name: "Test Workspace",
          slug: "test-workspace",
          role: WorkspaceRole.EDITOR,
          permissions: [WorkspacePermission.CREATE_FUNNELS, WorkspacePermission.EDIT_FUNNELS],
        },
      });
      expect(mockNext).not.toHaveBeenCalled();

      // Verify database state
      const updatedMember = await prisma.workspaceMember.findFirst({
        where: {
          userId: testUserId,
          workspaceId: testWorkspaceId,
        },
      });

      expect(updatedMember).toBeTruthy();
      expect(updatedMember!.status).toBe(MembershipStatus.ACTIVE);
      expect(updatedMember!.joinedAt).toBeTruthy();
      expect(updatedMember!.userId).toBe(testUserId);
    });

    it("should return already accepted message for ACTIVE membership", async () => {
      const prisma = getPrisma();

      // Create active membership
      await prisma.workspaceMember.create({
        data: {
          userId: testUserId,
          email: "invitee@test.com",
          workspaceId: testWorkspaceId,
          role: WorkspaceRole.EDITOR,
          permissions: [WorkspacePermission.CREATE_FUNNELS, WorkspacePermission.EDIT_FUNNELS],
          status: MembershipStatus.ACTIVE,
          invitedBy: inviterUserId,
          joinedAt: new Date(),
        },
      });

      mockReq.body = { token: invitationToken };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Invitation already accepted",
        workspace: {
          id: testWorkspaceId,
          name: "Test Workspace",
          slug: "test-workspace",
          role: WorkspaceRole.EDITOR,
          permissions: [WorkspacePermission.CREATE_FUNNELS, WorkspacePermission.EDIT_FUNNELS],
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject when no pending invitation found", async () => {
      // No pending invitation created
      mockReq.body = { token: invitationToken };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "No pending invitation found for this workspace" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should reject when invitation has been rejected", async () => {
      const prisma = getPrisma();

      // Create rejected invitation
      await prisma.workspaceMember.create({
        data: {
          userId: testUserId,
          email: "invitee@test.com",
          workspaceId: testWorkspaceId,
          role: WorkspaceRole.EDITOR,
          permissions: [WorkspacePermission.CREATE_FUNNELS, WorkspacePermission.EDIT_FUNNELS],
          status: MembershipStatus.REJECTED,
          invitedBy: inviterUserId,
        },
      });

      mockReq.body = { token: invitationToken };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: "This invitation has been rejected" })
      );
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should verify joinedAt is set when accepting invitation", async () => {
      const prisma = getPrisma();

      // Create pending invitation
      await prisma.workspaceMember.create({
        data: {
          userId: testUserId,
          email: "invitee@test.com",
          workspaceId: testWorkspaceId,
          role: WorkspaceRole.EDITOR,
          permissions: [WorkspacePermission.CREATE_FUNNELS, WorkspacePermission.EDIT_FUNNELS],
          status: MembershipStatus.PENDING,
          invitedBy: inviterUserId,
        },
      });

      const beforeAccept = new Date();
      mockReq.body = { token: invitationToken };

      await AcceptInvitationController.acceptInvitation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext
      );

      const afterAccept = new Date();

      // Verify joinedAt is set correctly
      const updatedMember = await prisma.workspaceMember.findFirst({
        where: {
          userId: testUserId,
          workspaceId: testWorkspaceId,
        },
      });

      expect(updatedMember!.joinedAt).toBeTruthy();
      expect(updatedMember!.joinedAt!.getTime()).toBeGreaterThanOrEqual(beforeAccept.getTime());
      expect(updatedMember!.joinedAt!.getTime()).toBeLessThanOrEqual(afterAccept.getTime());
    });
  });
});