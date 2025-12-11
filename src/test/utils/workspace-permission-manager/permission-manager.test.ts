import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionManager } from '../../../utils/workspace-utils/workspace-permission-manager';
import { PermissionAction } from '../../../utils/workspace-utils/workspace-permission-manager/types';
import { WorkspaceRole, WorkspacePermission } from '../../../generated/prisma-client';
import { getPrisma } from '../../../lib/prisma';

// Mock Prisma
vi.mock('../../../lib/prisma');

describe('PermissionManager', () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      workspace: {
        findUnique: vi.fn(),
      },
      workspaceMember: {
        findUnique: vi.fn(),
      },
    };

    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  describe('Owner Permissions', () => {
    it('should allow owner to delete workspace', async () => {
      // Mock owner
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 100, // User 100 is owner
      });

      const result = await PermissionManager.can({
        userId: 100,
        workspaceId: 1,
        action: PermissionAction.DELETE_WORKSPACE,
      });

      expect(result.allowed).toBe(true);
      expect(result.isOwner).toBe(true);
      expect(result.userRole).toBe(WorkspaceRole.OWNER);
    });

    it('should allow owner to create funnels', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 100,
      });

      const result = await PermissionManager.can({
        userId: 100,
        workspaceId: 1,
        action: PermissionAction.CREATE_FUNNEL,
      });

      expect(result.allowed).toBe(true);
    });

    it('should allow owner to manage workspace settings', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 100,
      });

      const result = await PermissionManager.can({
        userId: 100,
        workspaceId: 1,
        action: PermissionAction.MANAGE_WORKSPACE_SETTINGS,
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('Admin Permissions', () => {
    beforeEach(() => {
      // Mock admin member
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 999, // Someone else is owner
      });

      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 200,
        role: WorkspaceRole.ADMIN,
        permissions: [
          WorkspacePermission.CREATE_FUNNELS,
          WorkspacePermission.EDIT_FUNNELS,
          WorkspacePermission.DELETE_FUNNELS,
          WorkspacePermission.MANAGE_MEMBERS,
        ],
      });
    });

    it('should deny admin from deleting workspace', async () => {
      const result = await PermissionManager.can({
        userId: 200,
        workspaceId: 1,
        action: PermissionAction.DELETE_WORKSPACE,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should allow admin to create funnels', async () => {
      const result = await PermissionManager.can({
        userId: 200,
        workspaceId: 1,
        action: PermissionAction.CREATE_FUNNEL,
      });

      expect(result.allowed).toBe(true);
    });

    it('should allow admin to invite members', async () => {
      const result = await PermissionManager.can({
        userId: 200,
        workspaceId: 1,
        action: PermissionAction.INVITE_MEMBER,
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('Editor Permissions', () => {
    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 999,
      });

      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 300,
        role: WorkspaceRole.EDITOR,
        permissions: [
          WorkspacePermission.CREATE_FUNNELS,
          WorkspacePermission.EDIT_FUNNELS,
          WorkspacePermission.EDIT_PAGES,
          WorkspacePermission.VIEW_ANALYTICS,
        ],
      });
    });

    it('should allow editor to create funnels', async () => {
      const result = await PermissionManager.can({
        userId: 300,
        workspaceId: 1,
        action: PermissionAction.CREATE_FUNNEL,
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny editor from deleting funnels without permission', async () => {
      const result = await PermissionManager.can({
        userId: 300,
        workspaceId: 1,
        action: PermissionAction.DELETE_FUNNEL,
      });

      expect(result.allowed).toBe(false);
    });

    it('should allow editor to edit pages', async () => {
      const result = await PermissionManager.can({
        userId: 300,
        workspaceId: 1,
        action: PermissionAction.EDIT_PAGE,
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny editor from inviting members without MANAGE_MEMBERS permission', async () => {
      const result = await PermissionManager.can({
        userId: 300,
        workspaceId: 1,
        action: PermissionAction.INVITE_MEMBER,
      });

      expect(result.allowed).toBe(false);
    });
  });

  describe('Viewer Permissions', () => {
    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 999,
      });

      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 400,
        role: WorkspaceRole.VIEWER,
        permissions: [WorkspacePermission.VIEW_ANALYTICS],
      });
    });

    it('should allow viewer to view funnels', async () => {
      const result = await PermissionManager.can({
        userId: 400,
        workspaceId: 1,
        action: PermissionAction.VIEW_FUNNEL,
      });

      expect(result.allowed).toBe(true);
    });

    it('should allow viewer to view analytics', async () => {
      const result = await PermissionManager.can({
        userId: 400,
        workspaceId: 1,
        action: PermissionAction.VIEW_ANALYTICS,
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny viewer from creating funnels', async () => {
      const result = await PermissionManager.can({
        userId: 400,
        workspaceId: 1,
        action: PermissionAction.CREATE_FUNNEL,
      });

      expect(result.allowed).toBe(false);
    });

    it('should deny viewer from editing funnels', async () => {
      const result = await PermissionManager.can({
        userId: 400,
        workspaceId: 1,
        action: PermissionAction.EDIT_FUNNEL,
      });

      expect(result.allowed).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should not throw when permission is granted', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 100,
      });

      await expect(
        PermissionManager.requirePermission({
          userId: 100,
          workspaceId: 1,
          action: PermissionAction.CREATE_FUNNEL,
        })
      ).resolves.not.toThrow();
    });

    it('should throw when permission is denied', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 999,
      });

      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 400,
        role: WorkspaceRole.VIEWER,
        permissions: [WorkspacePermission.VIEW_ANALYTICS],
      });

      await expect(
        PermissionManager.requirePermission({
          userId: 400,
          workspaceId: 1,
          action: PermissionAction.DELETE_FUNNEL,
        })
      ).rejects.toThrow();
    });
  });

  describe('getUserCapabilities', () => {
    it('should return full capabilities for owner', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 100,
      });

      const capabilities = await PermissionManager.getUserCapabilities(100, 1);

      expect(capabilities).not.toBeNull();
      expect(capabilities?.isOwner).toBe(true);
      expect(capabilities?.role).toBe(WorkspaceRole.OWNER);
      expect(capabilities?.canPerformActions.createFunnels).toBe(true);
      expect(capabilities?.canPerformActions.deleteWorkspace).toBe(true);
      expect(capabilities?.canPerformActions.inviteMembers).toBe(true);
    });

    it('should return limited capabilities for viewer', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 999,
      });

      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 400,
        role: WorkspaceRole.VIEWER,
        permissions: [WorkspacePermission.VIEW_ANALYTICS],
      });

      const capabilities = await PermissionManager.getUserCapabilities(400, 1);

      expect(capabilities).not.toBeNull();
      expect(capabilities?.isOwner).toBe(false);
      expect(capabilities?.role).toBe(WorkspaceRole.VIEWER);
      expect(capabilities?.canPerformActions.createFunnels).toBe(false);
      expect(capabilities?.canPerformActions.deleteWorkspace).toBe(false);
      expect(capabilities?.canPerformActions.viewAnalytics).toBe(true);
    });
  });

  describe('Role Change Validation', () => {
    it('should allow owner to promote editor to admin', () => {
      const result = PermissionManager.validateRoleChange({
        requesterId: 100,
        requesterRole: WorkspaceRole.OWNER,
        requesterPermissions: [],
        targetMemberId: 300,
        targetRole: WorkspaceRole.EDITOR,
        newRole: WorkspaceRole.ADMIN,
        isOwner: true,
      });

      expect(result.valid).toBe(true);
    });

    it('should deny admin from promoting to admin', () => {
      const result = PermissionManager.validateRoleChange({
        requesterId: 200,
        requesterRole: WorkspaceRole.ADMIN,
        requesterPermissions: [],
        targetMemberId: 300,
        targetRole: WorkspaceRole.EDITOR,
        newRole: WorkspaceRole.ADMIN,
        isOwner: false,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('owner');
    });

    it('should deny owner from demoting themselves', () => {
      const result = PermissionManager.validateRoleChange({
        requesterId: 100,
        requesterRole: WorkspaceRole.OWNER,
        requesterPermissions: [],
        targetMemberId: 100, // Same as requester
        targetRole: WorkspaceRole.OWNER,
        newRole: WorkspaceRole.ADMIN,
        isOwner: true,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('demote');
    });
  });

  describe('Domain Permissions', () => {
    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 999,
      });
    });

    it('should allow admin to create domains', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 200,
        role: WorkspaceRole.ADMIN,
        permissions: [WorkspacePermission.CREATE_DOMAINS],
      });

      const result = await PermissionManager.can({
        userId: 200,
        workspaceId: 1,
        action: PermissionAction.CREATE_SUBDOMAIN,
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny editor from creating domains without permission', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 300,
        role: WorkspaceRole.EDITOR,
        permissions: [WorkspacePermission.EDIT_FUNNELS],
      });

      const result = await PermissionManager.can({
        userId: 300,
        workspaceId: 1,
        action: PermissionAction.CREATE_CUSTOM_DOMAIN,
      });

      expect(result.allowed).toBe(false);
    });

    it('should allow admin to connect domains', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 200,
        role: WorkspaceRole.ADMIN,
        permissions: [WorkspacePermission.CONNECT_DOMAINS],
      });

      const result = await PermissionManager.can({
        userId: 200,
        workspaceId: 1,
        action: PermissionAction.CONNECT_DOMAIN,
      });

      expect(result.allowed).toBe(true);
    });

    it('should allow all members to view domains', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 400,
        role: WorkspaceRole.VIEWER,
        permissions: [],
      });

      const result = await PermissionManager.can({
        userId: 400,
        workspaceId: 1,
        action: PermissionAction.VIEW_DOMAINS,
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('Page Permissions', () => {
    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 999,
      });
    });

    it('should allow editor with EDIT_PAGES to create pages', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 300,
        role: WorkspaceRole.EDITOR,
        permissions: [WorkspacePermission.EDIT_PAGES],
      });

      const result = await PermissionManager.can({
        userId: 300,
        workspaceId: 1,
        action: PermissionAction.CREATE_PAGE,
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny editor without EDIT_PAGES from deleting pages', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 300,
        role: WorkspaceRole.EDITOR,
        permissions: [WorkspacePermission.EDIT_FUNNELS],
      });

      const result = await PermissionManager.can({
        userId: 300,
        workspaceId: 1,
        action: PermissionAction.DELETE_PAGE,
      });

      expect(result.allowed).toBe(false);
    });

    it('should allow admin to reorder pages', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 200,
        role: WorkspaceRole.ADMIN,
        permissions: [],
      });

      const result = await PermissionManager.can({
        userId: 200,
        workspaceId: 1,
        action: PermissionAction.REORDER_PAGE,
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('Theme Permissions', () => {
    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 999,
      });
    });

    it('should allow editor with EDIT_FUNNELS to create themes', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 300,
        role: WorkspaceRole.EDITOR,
        permissions: [WorkspacePermission.EDIT_FUNNELS],
      });

      const result = await PermissionManager.can({
        userId: 300,
        workspaceId: 1,
        action: PermissionAction.CREATE_THEME,
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny editor without DELETE_FUNNELS from deleting themes', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 300,
        role: WorkspaceRole.EDITOR,
        permissions: [WorkspacePermission.EDIT_FUNNELS],
      });

      const result = await PermissionManager.can({
        userId: 300,
        workspaceId: 1,
        action: PermissionAction.DELETE_THEME,
      });

      expect(result.allowed).toBe(false);
    });

    it('should allow admin to set active theme', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 200,
        role: WorkspaceRole.ADMIN,
        permissions: [],
      });

      const result = await PermissionManager.can({
        userId: 200,
        workspaceId: 1,
        action: PermissionAction.SET_ACTIVE_THEME,
      });

      expect(result.allowed).toBe(true);
    });

    it('should allow all members to view themes', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 400,
        role: WorkspaceRole.VIEWER,
        permissions: [],
      });

      const result = await PermissionManager.can({
        userId: 400,
        workspaceId: 1,
        action: PermissionAction.VIEW_THEMES,
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('Form Permissions', () => {
    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 999,
      });
    });

    it('should allow editor with EDIT_PAGES to create forms', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 300,
        role: WorkspaceRole.EDITOR,
        permissions: [WorkspacePermission.EDIT_PAGES],
      });

      const result = await PermissionManager.can({
        userId: 300,
        workspaceId: 1,
        action: PermissionAction.CREATE_FORM,
      });

      expect(result.allowed).toBe(true);
    });

    it('should allow editor with EDIT_PAGES to configure webhooks', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 300,
        role: WorkspaceRole.EDITOR,
        permissions: [WorkspacePermission.EDIT_PAGES],
      });

      const result = await PermissionManager.can({
        userId: 300,
        workspaceId: 1,
        action: PermissionAction.CONFIGURE_FORM_WEBHOOK,
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny editor without DELETE_FUNNELS from deleting forms', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 300,
        role: WorkspaceRole.EDITOR,
        permissions: [WorkspacePermission.EDIT_PAGES],
      });

      const result = await PermissionManager.can({
        userId: 300,
        workspaceId: 1,
        action: PermissionAction.DELETE_FORM,
      });

      expect(result.allowed).toBe(false);
    });

    it('should allow admin to update forms', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 200,
        role: WorkspaceRole.ADMIN,
        permissions: [],
      });

      const result = await PermissionManager.can({
        userId: 200,
        workspaceId: 1,
        action: PermissionAction.UPDATE_FORM,
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('Insight Permissions', () => {
    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 999,
      });
    });

    it('should allow editor with EDIT_PAGES to create insights', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 300,
        role: WorkspaceRole.EDITOR,
        permissions: [WorkspacePermission.EDIT_PAGES],
      });

      const result = await PermissionManager.can({
        userId: 300,
        workspaceId: 1,
        action: PermissionAction.CREATE_INSIGHT,
      });

      expect(result.allowed).toBe(true);
    });

    it('should allow viewer with VIEW_ANALYTICS to view submissions', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 400,
        role: WorkspaceRole.VIEWER,
        permissions: [WorkspacePermission.VIEW_ANALYTICS],
      });

      const result = await PermissionManager.can({
        userId: 400,
        workspaceId: 1,
        action: PermissionAction.VIEW_INSIGHT_SUBMISSIONS,
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny viewer without VIEW_ANALYTICS from viewing submissions', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 400,
        role: WorkspaceRole.VIEWER,
        permissions: [],
      });

      const result = await PermissionManager.can({
        userId: 400,
        workspaceId: 1,
        action: PermissionAction.VIEW_INSIGHT_SUBMISSIONS,
      });

      expect(result.allowed).toBe(false);
    });

    it('should allow admin to delete insights', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 200,
        role: WorkspaceRole.ADMIN,
        permissions: [],
      });

      const result = await PermissionManager.can({
        userId: 200,
        workspaceId: 1,
        action: PermissionAction.DELETE_INSIGHT,
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should return null capabilities for non-existent workspace', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      const capabilities = await PermissionManager.getUserCapabilities(100, 999);

      expect(capabilities).toBeNull();
    });

    it('should return null capabilities for non-member user', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 999,
      });

      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      const capabilities = await PermissionManager.getUserCapabilities(500, 1);

      expect(capabilities).toBeNull();
    });

    it('should deny unknown actions', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 100,
      });

      const result = await PermissionManager.can({
        userId: 100,
        workspaceId: 1,
        action: 'INVALID_ACTION' as PermissionAction,
      });

      expect(result.allowed).toBe(false);
    });

    it('should deny access when workspace does not exist', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      const result = await PermissionManager.can({
        userId: 100,
        workspaceId: 999,
        action: PermissionAction.CREATE_FUNNEL,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('access');
    });

    it('should deny access when user is not a member', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 999,
      });

      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      const result = await PermissionManager.can({
        userId: 500,
        workspaceId: 1,
        action: PermissionAction.VIEW_FUNNEL,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('access');
    });
  });

  describe('Member Hierarchy Validation', () => {
    beforeEach(() => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 999,
      });
    });

    it('should deny admin from removing another admin', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 200,
        role: WorkspaceRole.ADMIN,
        permissions: [WorkspacePermission.MANAGE_MEMBERS],
      });

      const result = await PermissionManager.can({
        userId: 200,
        workspaceId: 1,
        action: PermissionAction.REMOVE_MEMBER,
        targetUserId: 201,
        targetRole: WorkspaceRole.ADMIN,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should allow admin to remove editor', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 200,
        role: WorkspaceRole.ADMIN,
        permissions: [WorkspacePermission.MANAGE_MEMBERS],
      });

      const result = await PermissionManager.can({
        userId: 200,
        workspaceId: 1,
        action: PermissionAction.REMOVE_MEMBER,
        targetUserId: 300,
        targetRole: WorkspaceRole.EDITOR,
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny anyone from removing owner', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        userId: 200,
        role: WorkspaceRole.ADMIN,
        permissions: [WorkspacePermission.MANAGE_MEMBERS],
      });

      const result = await PermissionManager.can({
        userId: 200,
        workspaceId: 1,
        action: PermissionAction.REMOVE_MEMBER,
        targetUserId: 999,
        targetRole: WorkspaceRole.OWNER,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });
});
