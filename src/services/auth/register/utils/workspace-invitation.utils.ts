import jwt from "jsonwebtoken";
import { MembershipStatus, WorkspaceRole, WorkspacePermission } from "../../../../generated/prisma-client";

export interface ProcessedInvitation {
  id: number;
  name: string;
  slug: string;
  role: WorkspaceRole;
  permissions: WorkspacePermission[];
}

export class WorkspaceInvitationProcessor {
  /**
   * Decodes a workspace invitation token
   * Pure function - no database calls
   */
  static decodeInvitationToken(token: string, jwtSecret: string): any | null {
    try {
      return jwt.verify(token, jwtSecret);
    } catch {
      return null;
    }
  }

  /**
   * Prepares data for updating a pending membership
   * Pure function - returns the data to be used in database update
   */
  static prepareMembershipUpdate() {
    return {
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
    };
  }

  /**
   * Formats workspace data for response
   * Pure function - transforms data
   */
  static formatWorkspaceResponse(
    workspace: { id: number; name: string; slug: string },
    member: { role: WorkspaceRole; permissions: WorkspacePermission[] }
  ): ProcessedInvitation {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: member.role,
      permissions: member.permissions,
    };
  }
}
