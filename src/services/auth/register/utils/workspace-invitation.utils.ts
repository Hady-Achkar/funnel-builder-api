import jwt from "jsonwebtoken";
import { MembershipStatus } from "../../../../generated/prisma-client";

export class WorkspaceInvitationProcessor {
  /**
   * Processes a workspace invitation token during user registration
   * Updates the pending membership to active (validation already done in early validation)
   */
  static async processWorkspaceInvitation(
    userId: number,
    userEmail: string,
    token: string,
    prisma: any
  ) {
    // Decode token (already validated in early validation, but needed for data)
    const tokenPayload = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Get workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: tokenPayload.workspaceId },
      select: { id: true, name: true, slug: true, ownerId: true },
    });

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Find existing PENDING membership by email (already validated in early validation)
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