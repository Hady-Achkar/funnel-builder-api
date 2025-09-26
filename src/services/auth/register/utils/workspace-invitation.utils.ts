import jwt from "jsonwebtoken";
import { AllocationService } from "../../../../utils/allocations";
import { MembershipStatus } from "../../../../generated/prisma-client";

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

    // Find existing PENDING membership by email
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        email: userEmail,
        workspaceId: workspace.id,
        status: MembershipStatus.PENDING,
      },
    });

    if (!existingMember) {
      throw new Error("No pending invitation found for this workspace");
    }

    // Update the pending membership to active
    const updatedMember = await prisma.workspaceMember.update({
      where: { id: existingMember.id },
      data: {
        userId,
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date(),
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: updatedMember.role,
      permissions: updatedMember.permissions,
    };
  }
}