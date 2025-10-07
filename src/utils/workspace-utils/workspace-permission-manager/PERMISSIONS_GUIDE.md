# Workspace Permission Manager - Complete Guide

## Overview

The **Workspace Permission Manager** is a centralized permission system that serves as the **single source of truth** for ALL workspace permission checks across the entire application.

### Why Centralized Permissions?

**Before**: Permission checks were scattered across:
- `src/helpers/funnel/duplicate/permissions.helper.ts`
- `src/helpers/domain/*/permissions.helper.ts` (8+ files)
- `src/services/workspace/configure/utils/`
- Inline checks in various services

**After**: One unified system in `src/utils/workspace-utils/workspace-permission-manager/`

✅ **Benefits**:
- Single source of truth
- Consistent permission logic
- Easy to maintain and update
- Type-safe with comprehensive enums
- Well-tested and documented

---

## Architecture

```
workspace-permission-manager/
├── types.ts                    # All enums, interfaces, types
├── permission-manager.ts       # Core PermissionManager class
├── PERMISSIONS_GUIDE.md        # This documentation
├── index.ts                    # Main exports
├── role-capabilities/          # Role-based capabilities
│   ├── owner.ts               # Owner permissions
│   ├── admin.ts               # Admin permissions
│   ├── editor.ts              # Editor permissions
│   └── viewer.ts              # Viewer permissions
└── action-checkers/            # Resource-specific checkers
    ├── workspace.ts           # Workspace operations
    ├── members.ts             # Member management
    ├── funnels.ts             # Funnel operations
    ├── domains.ts             # Domain operations
    ├── pages.ts               # Page operations
    ├── themes.ts              # Theme operations
    ├── forms.ts               # Form operations
    └── insights.ts            # Insight operations
```

---

## Quick Start

### Basic Usage

```typescript
import { PermissionManager, PermissionAction } from 'src/utils/workspace-utils/workspace-permission-manager';

// Example 1: Check permission (non-throwing)
const result = await PermissionManager.can({
  userId: 123,
  workspaceId: 456,
  action: PermissionAction.CREATE_FUNNEL
});

if (result.allowed) {
  // User can create funnels
  console.log(`User role: ${result.userRole}`);
} else {
  // User cannot create funnels
  console.log(`Denied: ${result.reason}`);
}

// Example 2: Require permission (throws if denied)
try {
  await PermissionManager.requirePermission({
    userId: 123,
    workspaceId: 456,
    action: PermissionAction.DELETE_DOMAIN
  });

  // Permission granted, proceed with action
  await deleteDomain(domainId);
} catch (error) {
  // Permission denied
  throw new ForbiddenError(error.message);
}

// Example 3: Get full user capabilities
const capabilities = await PermissionManager.getUserCapabilities(123, 456);

if (capabilities) {
  console.log(`Role: ${capabilities.role}`);
  console.log(`Can create funnels: ${capabilities.canPerformActions.createFunnels}`);
  console.log(`Can invite members: ${capabilities.canPerformActions.inviteMembers}`);
  console.log(`Can manage domains: ${capabilities.canPerformActions.manageDomains}`);
}
```

---

## Permission Actions

### Complete List of Actions

The `PermissionAction` enum defines ALL possible actions in the system:

#### Workspace Management
- `MANAGE_WORKSPACE_SETTINGS` - Update workspace settings
- `MANAGE_WORKSPACE_ALLOCATIONS` - Manage resource limits
- `DELETE_WORKSPACE` - Delete the workspace
- `VIEW_WORKSPACE` - View workspace details
- `UPDATE_WORKSPACE` - Update workspace info

#### Member Management
- `INVITE_MEMBER` - Invite new members
- `REMOVE_MEMBER` - Remove members
- `MODIFY_MEMBER_ROLE` - Change member roles
- `MODIFY_MEMBER_PERMISSIONS` - Change member permissions
- `VIEW_MEMBERS` - View member list
- `LEAVE_WORKSPACE` - Leave workspace

#### Funnel Operations
- `CREATE_FUNNEL` - Create new funnels
- `VIEW_FUNNEL` - View funnels
- `EDIT_FUNNEL` - Edit funnel content
- `DELETE_FUNNEL` - Delete funnels
- `DUPLICATE_FUNNEL` - Duplicate funnels
- `ARCHIVE_FUNNEL` - Archive funnels
- `RESTORE_FUNNEL` - Restore archived funnels

#### Page Operations
- `CREATE_PAGE` - Create pages in funnels
- `VIEW_PAGE` - View pages
- `EDIT_PAGE` - Edit page content
- `DELETE_PAGE` - Delete pages
- `DUPLICATE_PAGE` - Duplicate pages
- `REORDER_PAGE` - Reorder pages

#### Domain Operations
- `CREATE_SUBDOMAIN` - Create subdomain
- `CREATE_CUSTOM_DOMAIN` - Add custom domain
- `DELETE_DOMAIN` - Delete domain
- `CONNECT_DOMAIN` - Connect domain to funnel
- `DISCONNECT_DOMAIN` - Disconnect domain
- `MANAGE_DOMAIN` - Manage domain settings
- `VERIFY_DOMAIN` - Verify domain
- `VIEW_DOMAINS` - View domain list

#### Theme Operations
- `CREATE_THEME` - Create new theme
- `UPDATE_THEME` - Update theme
- `DELETE_THEME` - Delete theme
- `SET_ACTIVE_THEME` - Set active theme for funnel
- `VIEW_THEMES` - View themes

#### Form Operations
- `CREATE_FORM` - Create form
- `UPDATE_FORM` - Update form
- `DELETE_FORM` - Delete form
- `VIEW_FORM` - View form
- `CONFIGURE_FORM_WEBHOOK` - Configure webhook

#### Insight Operations
- `CREATE_INSIGHT` - Create insight
- `UPDATE_INSIGHT` - Update insight
- `DELETE_INSIGHT` - Delete insight
- `VIEW_INSIGHT` - View insight
- `VIEW_INSIGHT_SUBMISSIONS` - View submissions

#### Analytics
- `VIEW_ANALYTICS` - View analytics
- `EXPORT_ANALYTICS` - Export analytics

#### Media Management
- `UPLOAD_IMAGE` - Upload images
- `DELETE_IMAGE` - Delete images
- `MANAGE_IMAGE_FOLDERS` - Manage image folders

---

## Role Capabilities

### Role Hierarchy

```
OWNER (Highest)
  ↓
ADMIN
  ↓
EDITOR
  ↓
VIEWER (Lowest)
```

### Role Comparison Matrix

| Capability | OWNER | ADMIN | EDITOR | VIEWER |
|-----------|-------|-------|--------|--------|
| **Workspace Settings** | ✅ Full | ⚠️ With MANAGE_WORKSPACE | ⚠️ With MANAGE_WORKSPACE | ❌ No |
| **Delete Workspace** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Manage Allocations** | ✅ Yes | ⚠️ With MANAGE_WORKSPACE | ⚠️ With MANAGE_WORKSPACE | ❌ No |
| **Invite Members** | ✅ Yes | ✅ Yes | ⚠️ With MANAGE_MEMBERS | ❌ No |
| **Remove Members** | ✅ Yes | ✅ Yes (not admins) | ⚠️ With MANAGE_MEMBERS | ❌ No |
| **Promote to ADMIN** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Modify Other Admins** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Create Funnels** | ✅ Yes | ✅ Yes | ✅ Default | ⚠️ With permission |
| **Edit Funnels** | ✅ Yes | ✅ Yes | ✅ Default | ⚠️ With permission |
| **Delete Funnels** | ✅ Yes | ✅ Yes | ⚠️ With permission | ❌ No |
| **Create Domains** | ✅ Yes | ✅ Yes | ⚠️ With permission | ❌ No |
| **Delete Domains** | ✅ Yes | ✅ Yes | ⚠️ With permission | ❌ No |
| **Edit Pages** | ✅ Yes | ✅ Yes | ✅ Default | ⚠️ With permission |
| **View Analytics** | ✅ Yes | ✅ Yes | ✅ Default | ✅ Default |

Legend:
- ✅ Full access by default
- ⚠️ Needs explicit permission
- ❌ Not allowed

### Owner Role

**Full Authority** - The workspace creator with highest privileges.

**Key Rules**:
- ✅ Can do EVERYTHING
- ❌ Cannot promote others to OWNER (only 1 owner per workspace)
- ❌ Cannot demote themselves

**Use Cases**:
- Workspace creator
- Ultimate decision maker
- Can transfer ownership (not covered in this system)

```typescript
// Check if user is owner
const isOwner = await PermissionManager.isWorkspaceOwner(userId, workspaceId);
```

### Admin Role

**Broad Permissions** - Can manage most workspace aspects.

**Key Rules**:
- ✅ Has all base permissions
- ❌ Cannot modify other admins or owner
- ❌ Cannot promote to ADMIN or OWNER
- ⚠️ Needs MANAGE_WORKSPACE for allocations

**Default Permissions**:
All permissions except MANAGE_WORKSPACE (unless explicitly granted)

**Restrictions**:
```typescript
// Admin CANNOT do these:
- Promote anyone to ADMIN/OWNER
- Modify other admins' roles
- Modify owner's role/permissions
- Delete workspace
```

### Editor Role

**Content Manager** - Focused on creating and editing content.

**Key Rules**:
- ✅ Can create/edit funnels and pages
- ⚠️ Needs MANAGE_MEMBERS to modify roles
- ⚠️ Needs explicit permissions for admin tasks

**Default Permissions**:
- CREATE_FUNNELS
- EDIT_FUNNELS
- EDIT_PAGES
- VIEW_ANALYTICS

**Common Additions**:
```typescript
// Often granted these additional permissions:
- MANAGE_MEMBERS (to manage team)
- DELETE_FUNNELS (to clean up)
- CREATE_DOMAINS (to set up domains)
```

### Viewer Role

**Read-Only** - Minimal permissions by default.

**Key Rules**:
- ✅ Can view workspace content
- ❌ Cannot modify anything without explicit permissions
- ⚠️ Needs explicit permission for each action

**Default Permissions**:
- VIEW_ANALYTICS (only)

**Use Cases**:
- Stakeholders who need visibility
- External reviewers
- Read-only team members

---

## Advanced Usage

### Role Change Validation

```typescript
import { PermissionManager, WorkspaceRole } from '...';

// Validate role change before applying
const validation = PermissionManager.validateRoleChange({
  requesterId: 100,
  requesterRole: WorkspaceRole.ADMIN,
  requesterPermissions: [...],
  targetMemberId: 200,
  targetRole: WorkspaceRole.VIEWER,
  newRole: WorkspaceRole.EDITOR,
  isOwner: false
});

if (validation.valid) {
  // Apply role change
  await updateMemberRole(200, WorkspaceRole.EDITOR);
} else {
  throw new Error(validation.reason);
}
```

### Permission Change Validation

```typescript
// Validate permission changes
const validation = PermissionManager.validatePermissionChange({
  requesterId: 100,
  requesterRole: WorkspaceRole.OWNER,
  requesterPermissions: [...],
  targetMemberId: 200,
  targetRole: WorkspaceRole.EDITOR,
  permissionsToAdd: [WorkspacePermission.DELETE_FUNNELS],
  permissionsToRemove: [],
  isOwner: true
});

if (validation.valid) {
  // Apply permission changes
} else {
  console.error(validation.reason);
}
```

### Bulk Permission Checks

```typescript
// Check multiple permissions at once
const capabilities = await PermissionManager.getUserCapabilities(userId, workspaceId);

if (capabilities) {
  const actions = capabilities.canPerformActions;

  // Build UI based on capabilities
  showCreateButton(actions.createFunnels);
  showDeleteButton(actions.deleteFunnels);
  showInviteButton(actions.inviteMembers);
  showSettingsButton(actions.manageSettings);
}
```

---

## Integration Examples

### In Service Layer

```typescript
// services/funnel/create/index.ts
import { PermissionManager, PermissionAction } from 'src/utils/workspace-utils/workspace-permission-manager';

export class CreateFunnelService {
  static async create(userId: number, workspaceId: number, data: any) {
    // Check permission first
    await PermissionManager.requirePermission({
      userId,
      workspaceId,
      action: PermissionAction.CREATE_FUNNEL
    });

    // Proceed with funnel creation
    const funnel = await createFunnel(data);
    return funnel;
  }
}
```

### In Controller Layer

```typescript
// controllers/domain/delete/index.ts
import { PermissionManager, PermissionAction } from 'src/utils/workspace-utils/workspace-permission-manager';

export class DeleteDomainController {
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { domainId } = req.params;

      // Get workspace from domain
      const domain = await getDomain(domainId);

      // Check permission
      await PermissionManager.requirePermission({
        userId,
        workspaceId: domain.workspaceId,
        action: PermissionAction.DELETE_DOMAIN,
        resourceId: domainId
      });

      // Delete domain
      await deleteDomain(domainId);

      res.status(200).json({ message: 'Domain deleted' });
    } catch (error) {
      next(error);
    }
  }
}
```

### Replace Old Permission Checks

#### Before (Scattered)
```typescript
// ❌ Old way - scattered across codebase
const isOwner = workspace.ownerId === userId;
if (!isOwner) {
  const member = await prisma.workspaceMember.findUnique({...});
  if (!member || !member.permissions.includes(CREATE_FUNNELS)) {
    throw new Error("No permission");
  }
}
```

#### After (Centralized)
```typescript
// ✅ New way - centralized
await PermissionManager.requirePermission({
  userId,
  workspaceId,
  action: PermissionAction.CREATE_FUNNEL
});
```

---

## Testing

### Unit Tests

```typescript
import { PermissionManager, PermissionAction, WorkspaceRole } from '...';

describe('PermissionManager', () => {
  it('should allow owner to delete workspace', async () => {
    const result = await PermissionManager.can({
      userId: ownerUserId,
      workspaceId: testWorkspaceId,
      action: PermissionAction.DELETE_WORKSPACE
    });

    expect(result.allowed).toBe(true);
    expect(result.isOwner).toBe(true);
  });

  it('should deny admin from deleting workspace', async () => {
    const result = await PermissionManager.can({
      userId: adminUserId,
      workspaceId: testWorkspaceId,
      action: PermissionAction.DELETE_WORKSPACE
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('permission');
  });
});
```

---

## Migration Guide

### Step-by-Step Migration

1. **Identify Permission Check**
   ```typescript
   // Find code like this:
   if (!hasPermissionToCreateFunnel(role, permissions)) {
     throw new Error("No permission");
   }
   ```

2. **Replace with PermissionManager**
   ```typescript
   // Replace with:
   await PermissionManager.requirePermission({
     userId,
     workspaceId,
     action: PermissionAction.CREATE_FUNNEL
   });
   ```

3. **Remove Old Helpers**
   ```bash
   # After migration complete, remove:
   rm src/helpers/funnel/duplicate/permissions.helper.ts
   rm src/helpers/domain/*/permissions.helper.ts
   ```

4. **Update Tests**
   ```typescript
   // Update tests to use PermissionManager
   // Remove mocks for old permission helpers
   ```

---

## Best Practices

### ✅ DO

- Use `requirePermission()` in services (throws on denial)
- Use `can()` in controllers for conditional logic
- Use `getUserCapabilities()` for UI rendering
- Check permissions early in the request flow
- Use TypeScript for type safety

### ❌ DON'T

- Don't bypass permission checks
- Don't create custom permission logic
- Don't check permissions in multiple places
- Don't use inline permission checks
- Don't ignore permission denied errors

---

## Troubleshooting

### Common Issues

**Issue**: Permission denied for owner
```typescript
// Solution: Verify workspace ownership
const isOwner = await PermissionManager.isWorkspaceOwner(userId, workspaceId);
console.log('Is owner:', isOwner);
```

**Issue**: Editor can't perform action they should be able to
```typescript
// Solution: Check their actual permissions
const capabilities = await PermissionManager.getUserCapabilities(userId, workspaceId);
console.log('Role:', capabilities?.role);
console.log('Permissions:', capabilities?.permissions);
```

**Issue**: Permission check failing in tests
```typescript
// Solution: Ensure test database has proper workspace membership
await createWorkspaceMember({
  userId: testUserId,
  workspaceId: testWorkspaceId,
  role: WorkspaceRole.EDITOR,
  permissions: [WorkspacePermission.CREATE_FUNNELS]
});
```

---

## Future Enhancements

Potential improvements to consider:

1. **Caching**: Cache permission results for performance
2. **Audit Logging**: Log all permission checks
3. **Permission Templates**: Predefined permission sets
4. **Dynamic Permissions**: Database-driven permissions
5. **Permission History**: Track permission changes over time

---

## Support

For questions or issues:
1. Check this guide first
2. Review the code examples
3. Check existing tests for patterns
4. Consult the team for complex cases

---

**Last Updated**: 2025-10-07
**Version**: 1.0.0
**Status**: Production Ready ✅
