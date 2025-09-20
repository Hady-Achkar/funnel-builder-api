# Workspace Implementation Guide

## Overview
The workspace system provides multi-tenant functionality with plan-based limitations and fixed resource capacities. Each workspace has a fixed limit of 3 funnels, 3 subdomains, and 3 custom domains regardless of the subscription plan.

## System Architecture

### Key Concepts
1. **Plan-Based Workspace Limits**: Users can create workspaces based on their subscription plan
   - FREE: 1 workspace
   - BUSINESS: 3 workspaces
   - AGENCY: 10 workspaces

2. **Fixed Resource Limits per Workspace**: Each workspace has:
   - 3 funnels maximum
   - 3 subdomains maximum
   - 3 custom domains maximum

3. **Role-Based Access Control**:
   - OWNER: Full control
   - ADMIN: Can manage workspace and members
   - EDITOR: Can create/edit content
   - VIEWER: Read-only access

4. **Permissions System**: Granular permissions for specific actions

## API Endpoints

### 1. Create Workspace
**Endpoint**: `POST /api/workspace`
**Authentication**: Required
**Description**: Creates a new workspace for the authenticated user

**Request Body**:
```json
{
  "name": "My Agency",
  "slug": "my-agency",
  "description": "Digital marketing agency workspace"
}
```

**Validation Rules**:
- `name`: Required, 1-50 characters
- `slug`: Required, 3-30 characters, lowercase letters/numbers/hyphens only, must be unique
- `description`: Optional, max 200 characters
- Reserved slugs: admin, api, app, www, mail, ftp, blog, shop, support, help, docs

**Response (201 Created)**:
```json
{
  "message": "Workspace created successfully",
  "workspaceId": 123
}
```

**Error Responses**:
- `400`: Invalid input or validation failed
- `403`: Workspace limit reached for user's plan
- `409`: Slug already exists

### 2. Get All Workspaces
**Endpoint**: `GET /api/workspace`
**Authentication**: Required
**Description**: Returns all workspaces where the user is a member

**Response (200 OK)**:
```json
[
  {
    "id": 123,
    "name": "My Agency",
    "slug": "my-agency",
    "description": "Digital marketing agency workspace",
    "role": "OWNER",
    "permissions": ["MANAGE_WORKSPACE", "MANAGE_MEMBERS", "CREATE_FUNNELS"],
    "memberCount": 5,
    "funnelCount": 2,
    "domainCount": 1,
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

### 3. Get Workspace Details
**Endpoint**: `GET /api/workspace/:slug`
**Authentication**: Required
**Description**: Returns detailed information about a specific workspace

**Response (200 OK)**:
```json
{
  "id": 123,
  "name": "My Agency",
  "slug": "my-agency",
  "description": "Digital marketing agency workspace",
  "settings": {},
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",

  "owner": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "username": "johndoe"
  },

  "currentUserMember": {
    "role": "OWNER",
    "permissions": ["MANAGE_WORKSPACE", "MANAGE_MEMBERS", "CREATE_FUNNELS"],
    "joinedAt": "2024-01-15T10:00:00Z"
  },

  "members": [
    {
      "id": 1,
      "userId": 1,
      "role": "OWNER",
      "permissions": ["MANAGE_WORKSPACE", "MANAGE_MEMBERS"],
      "joinedAt": "2024-01-15T10:00:00Z",
      "user": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "username": "johndoe"
      }
    }
  ],

  "domains": [
    {
      "id": 1,
      "hostname": "my-agency.example.com",
      "type": "SUBDOMAIN",
      "status": "ACTIVE",
      "sslStatus": "ACTIVE",
      "isVerified": true,
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],

  "funnels": [
    {
      "id": 1,
      "name": "Sales Funnel",
      "slug": "sales-funnel",
      "status": "PUBLISHED",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "pagesCount": 3
    }
  ],

  "usage": {
    "funnelsUsed": 2,
    "customDomainsUsed": 1,
    "subdomainsUsed": 1
  }
}
```

**Error Responses**:
- `403`: User is not a member of this workspace
- `404`: Workspace not found

### 4. Configure Workspace (Member Management)
**Endpoint**: `PATCH /api/workspace/configure`
**Authentication**: Required
**Description**: Manage workspace member roles and permissions

**Request Body**:
```json
{
  "workspaceSlug": "my-agency",
  "memberId": 5,
  "newRole": "EDITOR",
  "addPermissions": ["CREATE_FUNNELS", "EDIT_FUNNELS"],
  "removePermissions": ["DELETE_FUNNELS"]
}
```

**Validation Rules**:
- At least one change (role or permissions) must be specified
- `memberId` is required when modifying roles/permissions
- Role hierarchy is enforced (can't modify higher-level roles)
- Owner cannot be changed

**Response (200 OK)**:
```json
{
  "message": "Workspace member updated successfully",
  "member": {
    "id": 5,
    "userId": 10,
    "role": "EDITOR",
    "permissions": ["CREATE_FUNNELS", "EDIT_FUNNELS", "EDIT_PAGES"],
    "joinedAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-25T15:00:00Z",
    "user": {
      "id": 10,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com"
    }
  },
  "changes": {
    "roleChanged": true,
    "permissionsAdded": ["CREATE_FUNNELS", "EDIT_FUNNELS"],
    "permissionsRemoved": ["DELETE_FUNNELS"]
  }
}
```

**Error Responses**:
- `400`: Invalid request or validation failed
- `403`: Insufficient permissions to perform this action
- `404`: Workspace or member not found

## Related Endpoints

### Funnels within Workspace
**Get all funnels**: `GET /api/funnel/workspace/:workspaceSlug`
Returns all funnels in a workspace (respects 3-funnel limit)

### Domains within Workspace
**Get all domains**: `GET /api/domain/:workspaceSlug`
Returns all domains (custom and subdomains) in a workspace

### Domain-Funnel Connections
**Get connections**: `GET /api/domain-funnel/connections/:workspaceSlug`
Returns all domain-funnel connections in a workspace

## Frontend Implementation Guide

### 1. Workspace Creation Flow
```javascript
// Check if user can create workspace
const checkWorkspaceLimit = async () => {
  const workspaces = await api.get('/workspace');
  const userPlan = getUserPlan(); // Get from user context

  const limits = {
    FREE: 1,
    BUSINESS: 3,
    AGENCY: 10
  };

  if (workspaces.length >= limits[userPlan]) {
    throw new Error('Workspace limit reached for your plan');
  }
};

// Create workspace
const createWorkspace = async (data) => {
  try {
    // Validate slug format on frontend
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(data.slug)) {
      throw new Error('Invalid slug format');
    }

    const response = await api.post('/workspace', {
      name: data.name,
      slug: data.slug.toLowerCase(),
      description: data.description
    });

    // Redirect to new workspace
    router.push(`/workspace/${data.slug}`);
  } catch (error) {
    handleError(error);
  }
};
```

### 2. Workspace Selection/Switching
```javascript
// Get user's workspaces for dropdown/switcher
const getUserWorkspaces = async () => {
  const workspaces = await api.get('/workspace');

  // Display in UI with usage indicators
  return workspaces.map(ws => ({
    ...ws,
    isFull: ws.funnelCount >= 3,
    usage: `${ws.funnelCount}/3 funnels, ${ws.domainCount}/6 domains`
  }));
};
```

### 3. Workspace Dashboard
```javascript
// Load workspace details
const loadWorkspace = async (slug) => {
  try {
    const workspace = await api.get(`/workspace/${slug}`);

    // Check user permissions
    const canEdit = workspace.currentUserMember.permissions.includes('EDIT_FUNNELS');
    const canManage = workspace.currentUserMember.role === 'OWNER' ||
                     workspace.currentUserMember.role === 'ADMIN';

    // Display usage warnings
    if (workspace.usage.funnelsUsed >= 3) {
      showWarning('Funnel limit reached (3/3)');
    }

    return workspace;
  } catch (error) {
    if (error.status === 403) {
      showError('You do not have access to this workspace');
    }
  }
};
```

### 4. Member Management
```javascript
// Update member role/permissions
const updateMember = async (workspaceSlug, memberId, changes) => {
  try {
    const response = await api.patch('/workspace/configure', {
      workspaceSlug,
      memberId,
      ...changes
    });

    showSuccess('Member updated successfully');
    refreshMemberList();
  } catch (error) {
    if (error.status === 403) {
      showError('You do not have permission to manage members');
    }
  }
};
```

### 5. Resource Creation with Limit Checking
```javascript
// Before creating a funnel
const canCreateFunnel = (workspace) => {
  if (workspace.usage.funnelsUsed >= 3) {
    showError('Funnel limit reached. Each workspace can have max 3 funnels.');
    return false;
  }

  if (!workspace.currentUserMember.permissions.includes('CREATE_FUNNELS')) {
    showError('You do not have permission to create funnels');
    return false;
  }

  return true;
};

// Before adding a domain
const canAddDomain = (workspace, type) => {
  const limits = {
    customDomains: 3,
    subdomains: 3
  };

  if (type === 'CUSTOM' && workspace.usage.customDomainsUsed >= limits.customDomains) {
    showError('Custom domain limit reached (3/3)');
    return false;
  }

  if (type === 'SUBDOMAIN' && workspace.usage.subdomainsUsed >= limits.subdomains) {
    showError('Subdomain limit reached (3/3)');
    return false;
  }

  return true;
};
```

## Error Handling

### Common Error Codes
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions or limit reached
- `404`: Not Found - Resource doesn't exist
- `409`: Conflict - Resource already exists (e.g., duplicate slug)

### Error Response Format
```json
{
  "error": {
    "code": "WORKSPACE_LIMIT_REACHED",
    "message": "You have reached the maximum number of workspaces for your plan",
    "details": {
      "currentCount": 1,
      "maxAllowed": 1,
      "plan": "FREE"
    }
  }
}
```

## Permissions Matrix

| Permission | OWNER | ADMIN | EDITOR | VIEWER |
|------------|-------|-------|--------|--------|
| MANAGE_WORKSPACE | ✓ | ✓ | - | - |
| MANAGE_MEMBERS | ✓ | ✓ | - | - |
| CREATE_FUNNELS | ✓ | ✓ | ✓ | - |
| EDIT_FUNNELS | ✓ | ✓ | ✓ | - |
| EDIT_PAGES | ✓ | ✓ | ✓ | - |
| DELETE_FUNNELS | ✓ | ✓ | - | - |
| VIEW_ANALYTICS | ✓ | ✓ | ✓ | ✓ |
| MANAGE_DOMAINS | ✓ | ✓ | - | - |
| CREATE_DOMAINS | ✓ | ✓ | - | - |
| DELETE_DOMAINS | ✓ | ✓ | - | - |
| CONNECT_DOMAINS | ✓ | ✓ | ✓ | - |

## Best Practices

1. **Always check limits before creation**: Validate on frontend before API calls
2. **Cache workspace data**: Store current workspace in context to avoid repeated API calls
3. **Handle permissions gracefully**: Hide/disable UI elements based on user permissions
4. **Show usage indicators**: Display resource usage (e.g., "2/3 funnels used")
5. **Implement proper error handling**: Show user-friendly messages for limit errors
6. **Use optimistic updates**: Update UI immediately, rollback on error
7. **Validate slug availability**: Check slug uniqueness before submission

## Migration Notes

The system has been refactored from allocation-based to plan-based limits:
- Old system: Dynamic allocation of resources
- New system: Fixed limits (3 funnels, 3 subdomains, 3 custom domains per workspace)
- Plan limits apply to workspace creation only, not resource capacity