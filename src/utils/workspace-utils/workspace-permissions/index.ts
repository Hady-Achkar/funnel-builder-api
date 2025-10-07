import { WorkspaceRole, WorkspacePermission } from "../../../generated/prisma-client";

export interface WorkspaceMember {
  role: WorkspaceRole;
  permissions: WorkspacePermission[];
}

export class WorkspacePermissions {
  static canInviteMembers(member: WorkspaceMember): boolean {
    if (
      member.role === WorkspaceRole.OWNER ||
      member.role === WorkspaceRole.ADMIN
    ) {
      return true;
    }

    return member.permissions.includes(WorkspacePermission.MANAGE_MEMBERS);
  }
}
