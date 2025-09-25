import jwt from "jsonwebtoken";
import { AllocationService } from "../../../../utils/allocations";

export class WorkspaceInvitationProcessor {
  /**
   * Processes a workspace invitation token during user registration
   * Validates the token, checks workspace limits, and adds the user as a member
   */
  static async processWorkspaceInvitation(
    userId: number,
    userEmail: string,
    token: string,
    prisma: any
  ) {
    // Decode and verify invitation token
    const tokenPayload = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Verify token type
    if (tokenPayload.type !== "workspace_invitation") {
      throw new Error("Invalid invitation token type");
    }

    // Verify email matches
    if (tokenPayload.email !== userEmail) {
      throw new Error("Email mismatch in invitation token");
    }

    // Get workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: tokenPayload.workspaceId },
      select: { id: true, name: true, slug: true, ownerId: true },
    });

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Check allocation limits (use workspace owner's plan)
    const canAddMember = await AllocationService.canAddMember(workspace.ownerId, workspace.id);
    if (!canAddMember) {
      throw new Error("Workspace member limit reached");
    }

    // Get permissions from workspace role permission templates
    const rolePermTemplate = await prisma.workspaceRolePermTemplate.findUnique({
      where: {
        workspaceId_role: {
          workspaceId: workspace.id,
          role: tokenPayload.role,
        },
      },
    });

    const permissions = rolePermTemplate?.permissions || [];

    // Create workspace member
    const newMember = await prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId: workspace.id,
        role: tokenPayload.role,
        permissions: permissions,
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: newMember.role,
      permissions: newMember.permissions,
    };
  }
}