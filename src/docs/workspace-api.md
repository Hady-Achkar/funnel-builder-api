# Workspace API Documentation

## Overview

All workspace routes require authentication via `authenticateToken` middleware. Workspaces provide role-based access control with hierarchical permissions and resource allocation management.

---

## 1. Get All Workspaces

**Route:** `GET /api/workspaces`  
**Authentication:** Required

### Response

```json
[
  {
    "id": 1,
    "name": "My First Workspace",
    "role": "OWNER"
  },
  {
    "id": 2,
    "name": "Shared Workspace", 
    "role": "ADMIN"
  }
]
```

### Notes

- Returns all workspaces where user is owner or member
- Includes user's role in each workspace
- Owner role takes precedence over member role

---

## 2. Configure Workspace

**Route:** `PATCH /api/workspaces/configure`  
**Authentication:** Required

### Request Body

| Field               | Type     | Required | Description                           |
| ------------------- | -------- | -------- | ------------------------------------- |
| `workspaceId`       | number   | Yes      | Target workspace ID                   |
| `memberId`          | number   | Yes      | Target member user ID                 |
| `newRole`           | enum     | No       | New role (OWNER, ADMIN, EDITOR, VIEWER) |
| `addPermissions`    | array    | No       | Permissions to add                    |
| `removePermissions` | array    | No       | Permissions to remove                 |
| `allocations`       | object   | No       | Resource allocation updates           |

### Allocation Object

| Field                   | Type   | Required | Description                    |
| ----------------------- | ------ | -------- | ------------------------------ |
| `allocatedFunnels`      | number | No       | Number of funnels allocated    |
| `allocatedCustomDomains`| number | No       | Number of custom domains       |
| `allocatedSubdomains`   | number | No       | Number of subdomains           |

### Response

```json
{
  "message": "Workspace configuration updated successfully"
}
```

### Notes

- At least one change (role, permissions, or allocations) must be specified
- Role changes follow hierarchical rules
- Allocation changes validate against owner's total limits across all workspaces
- Owner cannot promote others to OWNER or demote themselves
- Admin can only modify EDITOR/VIEWER roles
- EDITOR/VIEWER need MANAGE_MEMBERS permission to modify each other

---

## Role Hierarchy & Permissions

### Role Hierarchy (High to Low)

1. **OWNER** - Full control, cannot be changed by others
2. **ADMIN** - Can manage EDITOR/VIEWER roles and permissions
3. **EDITOR** - Standard editing capabilities
4. **VIEWER** - Read-only access

### Available Permissions

- `MANAGE_MEMBERS` - Add/remove members, modify member roles
- `MANAGE_WORKSPACE` - Modify workspace settings and allocations
- `CREATE_FUNNELS` - Create new funnels
- `EDIT_FUNNELS` - Edit existing funnels
- `DELETE_FUNNELS` - Delete funnels
- `VIEW_ANALYTICS` - Access analytics data

### Permission Assignment Rules

| Requester Role | Can Modify         | Can Assign Permissions To |
| -------------- | ------------------ | -------------------------- |
| OWNER          | All roles          | All roles                  |
| ADMIN          | EDITOR, VIEWER     | EDITOR, VIEWER             |
| EDITOR         | VIEWER (with perm) | VIEWER (with perm)         |
| VIEWER         | VIEWER (with perm) | VIEWER (with perm)         |

**Note:** EDITOR/VIEWER require `MANAGE_MEMBERS` permission to modify other members.

---

## Resource Allocation System

### Allocation Tracking

The system tracks resource allocations across **all workspaces** owned by a user to prevent over-allocation of their account limits.

### Validation Logic

When allocating resources to a workspace, the system:

1. Calculates total allocations across all other owned workspaces
2. Adds the requested allocation for the current workspace
3. Validates the total doesn't exceed owner's account limits

### Example Scenario

**Owner's Account Limits:** 5 funnels, 3 custom domains, 10 subdomains

**Existing Allocations:**
- Workspace A: 2 funnels, 1 custom domain, 4 subdomains
- Workspace B: 1 funnel, 1 custom domain, 3 subdomains

**Available for Workspace C:** 2 funnels, 1 custom domain, 3 subdomains

### Allocation Error Messages

```json
{
  "message": "Cannot allocate 7 funnels. Owner has 5 total funnels, 3 already allocated to other workspaces (2 over limit)"
}
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "message": "Error message here"
}
```

### Common Errors

- **400** - Validation errors, invalid allocation requests
- **401** - Authentication required
- **403** - Insufficient permissions, role hierarchy violations
- **404** - Workspace or member not found
- **500** - Server error

### Detailed Error Examples

#### Permission Errors
```json
{
  "message": "Only owners and admins can modify member roles"
}
```

#### Role Hierarchy Errors
```json
{
  "message": "Cannot promote others to owner role"
}
```

#### Allocation Errors
```json
{
  "message": "Cannot allocate 5 custom domains. Owner has 3 total custom domains, 2 already allocated to other workspaces (2 over limit)"
}
```

---

## Permission Requirements

### Configure Workspace Operations

| Operation              | Required Permission/Role                    |
| ---------------------- | ------------------------------------------- |
| Change Role to ADMIN   | OWNER only                                  |
| Change Role to EDITOR/VIEWER | OWNER, ADMIN, or MANAGE_MEMBERS        |
| Assign Permissions     | Higher role or MANAGE_MEMBERS              |
| Manage Allocations     | OWNER or MANAGE_WORKSPACE permission       |

### Access Control Rules

1. **Owner Privileges:**
   - Can modify any role except cannot promote others to OWNER
   - Can assign any permissions
   - Can manage all workspace allocations
   - Cannot demote themselves from owner

2. **Admin Privileges:**
   - Can modify EDITOR/VIEWER roles only
   - Can assign permissions to EDITOR/VIEWER
   - Cannot modify allocations unless has MANAGE_WORKSPACE permission

3. **Editor/Viewer with MANAGE_MEMBERS:**
   - Can modify VIEWER roles only
   - Can assign permissions to VIEWER roles
   - Cannot modify allocations unless has MANAGE_WORKSPACE permission

---

## Request Examples

### Promote User to Admin

```bash
curl -X PATCH /api/workspaces/configure \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": 1,
    "memberId": 5,
    "newRole": "ADMIN"
  }'
```

### Add Permissions

```bash
curl -X PATCH /api/workspaces/configure \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": 1,
    "memberId": 5,
    "addPermissions": ["CREATE_FUNNELS", "EDIT_FUNNELS"]
  }'
```

### Update Allocations

```bash
curl -X PATCH /api/workspaces/configure \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": 1,
    "memberId": 5,
    "allocations": {
      "allocatedFunnels": 3,
      "allocatedCustomDomains": 2,
      "allocatedSubdomains": 5
    }
  }'
```

### Combined Changes

```bash
curl -X PATCH /api/workspaces/configure \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": 1,
    "memberId": 5,
    "newRole": "EDITOR",
    "addPermissions": ["CREATE_FUNNELS"],
    "removePermissions": ["DELETE_FUNNELS"],
    "allocations": {
      "allocatedFunnels": 2
    }
  }'
```

---

## Workspace Roles & Capabilities

### OWNER
- **Can Do:** Everything except promote others to owner
- **Cannot Do:** Demote themselves, promote others to owner
- **Auto-Permissions:** All permissions implicitly

### ADMIN  
- **Can Do:** Manage EDITOR/VIEWER roles and permissions
- **Cannot Do:** Modify other ADMINs or OWNER, allocate resources (unless has MANAGE_WORKSPACE)
- **Default Permissions:** Usually has most permissions

### EDITOR
- **Can Do:** Edit content, manage VIEWERs (with MANAGE_MEMBERS)
- **Cannot Do:** Modify higher roles, allocate resources (unless has MANAGE_WORKSPACE)
- **Typical Permissions:** CREATE_FUNNELS, EDIT_FUNNELS

### VIEWER
- **Can Do:** View content, manage other VIEWERs (with MANAGE_MEMBERS)
- **Cannot Do:** Modify content or higher roles
- **Typical Permissions:** Minimal, mostly read-only

---

## Security Considerations

1. **Role Escalation Prevention:** Users cannot promote others to roles higher than their own
2. **Owner Protection:** Only one owner per workspace, cannot be changed via API
3. **Permission Boundaries:** Users can only assign permissions they possess or have authority over
4. **Resource Limits:** Cross-workspace allocation tracking prevents resource over-allocation
5. **Audit Trail:** All configuration changes should be logged (implementation dependent)

---

## Best Practices

1. **Principle of Least Privilege:** Assign minimum required permissions
2. **Role-Based Design:** Use roles for common permission sets, individual permissions for specific needs
3. **Resource Planning:** Plan allocations across workspaces to avoid hitting limits
4. **Regular Audits:** Review workspace configurations periodically
5. **Error Handling:** Always check for allocation limits before making promises to users