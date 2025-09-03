# Funnel API Documentation

## Overview

All funnel routes require authentication via `authenticateToken` middleware unless specified as public.

---

## 1. Create Funnel

**Route:** `POST /api/funnels`  
**Authentication:** Required

### Request Body

| Field         | Type   | Required | Default                  | Description                   |
| ------------- | ------ | -------- | ------------------------ | ----------------------------- |
| `name`        | string | No       | Auto-generated date/time | Funnel name (max 100 chars)   |
| `slug`        | string | No       | Auto-generated from name | URL-friendly identifier       |
| `status`      | enum   | No       | `DRAFT`                  | DRAFT, LIVE, ARCHIVED, SHARED |
| `workspaceId` | number | Yes      | -                        | Target workspace ID           |

### Response

```json
{
  "message": "Funnel created successfully!",
  "funnelId": 123
}
```

### Notes

- Auto-generates slug from name (or date if name is auto-generated)
- Creates default theme and home page
- Validates slug uniqueness within workspace
- Invalid characters in name throw error

---

## 2. Get Funnel

**Route:** `GET /api/funnels/:funnelId`  
**Authentication:** Required

### URL Parameters

| Field      | Type   | Required | Description           |
| ---------- | ------ | -------- | --------------------- |
| `funnelId` | number | Yes      | Funnel ID to retrieve |

### Response

```json
{
  "message": "Funnel retrieved successfully",
  "funnel": {
    "id": 123,
    "name": "My Funnel",
    "slug": "my-funnel",
    "status": "DRAFT",
    "workspaceId": 1,
    "createdBy": 2,
    "themeId": 7,
    "createdAt": "2025-08-23T09:45:46.265Z",
    "updatedAt": "2025-08-23T09:45:46.268Z",
    "theme": {
      /* theme object */
    },
    "pages": [
      /* array of pages without content */
    ]
  }
}
```

### Notes

- Returns funnel with theme and pages (without content)
- Uses cache-first approach
- Requires view permissions in workspace

---

## 3. Get All Funnels

**Route:** `GET /api/funnels/workspace/:workspaceId`  
**Authentication:** Required

### URL Parameters

| Field         | Type   | Required | Description  |
| ------------- | ------ | -------- | ------------ |
| `workspaceId` | number | Yes      | Workspace ID |

### Query Parameters

| Field       | Type   | Required | Default     | Description                |
| ----------- | ------ | -------- | ----------- | -------------------------- |
| `page`      | number | No       | 1           | Page number                |
| `limit`     | number | No       | 10          | Items per page (max 100)   |
| `sortBy`    | string | No       | `createdAt` | createdAt, updatedAt, name |
| `sortOrder` | string | No       | `desc`      | asc, desc                  |
| `status`    | enum   | No       | -           | Filter by status           |

### Response

```json
{
  "message": "Funnels retrieved successfully",
  "funnels": [
    {
      "id": 123,
      "name": "My Funnel",
      "slug": "my-funnel",
      "status": "LIVE",
      "workspaceId": 1,
      "createdBy": 2,
      "themeId": 7,
      "createdAt": "2025-08-23T09:45:46.265Z",
      "updatedAt": "2025-08-23T09:45:46.268Z",
      "theme": {
        /* theme object */
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Notes

- Returns paginated list of funnels with themes
- Uses cache-first approach
- Pages not included in list response

---

## 4. Update Funnel

**Route:** `PUT /api/funnels/:funnelId`  
**Authentication:** Required

### URL Parameters

| Field      | Type   | Required | Description         |
| ---------- | ------ | -------- | ------------------- |
| `funnelId` | number | Yes      | Funnel ID to update |

### Request Body

| Field    | Type   | Required | Description                         |
| -------- | ------ | -------- | ----------------------------------- |
| `name`   | string | No       | New funnel name                     |
| `slug`   | string | No       | New slug (validated for uniqueness) |
| `status` | enum   | No       | New status                          |

### Response

```json
{
  "message": "Funnel [name] updated successfully",
  "funnelId": 123
}
```

### Notes

- At least one field required
- Auto-updates slug when name changes (if slug not provided)
- Validates slug uniqueness within workspace
- User-friendly error for duplicate slugs

---

## 5. Delete Funnel

**Route:** `DELETE /api/funnels/:funnelId`  
**Authentication:** Required

### URL Parameters

| Field      | Type   | Required | Description         |
| ---------- | ------ | -------- | ------------------- |
| `funnelId` | number | Yes      | Funnel ID to delete |

### Response

```json
{
  "message": "Funnel deleted successfully"
}
```

### Notes

- Requires delete permissions
- Cascades deletion to pages and theme
- Cleans up all related cache keys including page caches

---

## 6. Duplicate Funnel

**Route:** `POST /api/funnels/:funnelId/duplicate`  
**Authentication:** Required

### URL Parameters

| Field      | Type   | Required | Description            |
| ---------- | ------ | -------- | ---------------------- |
| `funnelId` | number | Yes      | Funnel ID to duplicate |

### Request Body

| Field         | Type   | Required | Default              | Description      |
| ------------- | ------ | -------- | -------------------- | ---------------- |
| `name`        | string | No       | "Copy of [original]" | New funnel name  |
| `workspaceId` | number | No       | Same workspace       | Target workspace |

### Response

```json
{
  "message": "Funnel duplicated successfully to workspace [name]",
  "funnelId": 124
}
```

### Notes

- Auto-generates unique name if conflict
- Generates unique slug from new name
- Duplicates theme and all pages
- Updates internal page linking IDs

---

## 7. Create From Template

**Route:** `POST /api/funnels/from-template/:templateId`  
**Authentication:** Required

### URL Parameters

| Field        | Type   | Required | Description        |
| ------------ | ------ | -------- | ------------------ |
| `templateId` | number | Yes      | Template ID to use |

### Request Body

| Field         | Type   | Required | Description              |
| ------------- | ------ | -------- | ------------------------ |
| `name`        | string | Yes      | Funnel name              |
| `slug`        | string | No       | Auto-generated from name |
| `workspaceId` | number | Yes      | Target workspace ID      |

### Response

```json
{
  "message": "Funnel created successfully from template in workspace [name]",
  "funnelId": 125
}
```

### Notes

- Template must be active and public
- Auto-generates slug from name
- Creates theme and copies all template pages
- Updates internal page linking IDs
- Validates name for invalid characters

---

## Cache Keys

### Primary Keys (Used)

- `workspace:{workspaceId}:funnel:{funnelId}:full` - Individual funnel data with pages (no content)
- `workspace:{workspaceId}:funnels:all` - All funnels in workspace
- `funnel:{funnelId}:page:{pageId}:full` - Individual page with content

### Legacy Keys (Cleaned on update)

- `workspace:{workspaceId}:funnels:list`
- `user:{userId}:workspace:{workspaceId}:funnels`

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error message here"
}
```

### Common Errors

- **400** - Invalid input, validation errors
- **401** - Authentication required
- **403** - Insufficient permissions
- **404** - Resource not found
- **409** - Conflict (duplicate name/slug)
- **500** - Server error

---

## Slug Validation Rules

1. **Allowed Characters:** Letters (a-z), numbers (0-9), hyphens (-), spaces, underscores
2. **Auto-conversion:** Spaces and underscores → hyphens, uppercase → lowercase
3. **Rejected Characters:** Special characters (@, #, $, %, etc.)
4. **Uniqueness:** Must be unique within workspace
5. **Auto-generation:**
   - From name: "My Funnel" → "my-funnel"
   - From date: "23.08.2025 13:31" → "23-08-2025-13-31"
   - Conflicts: Appends number ("my-funnel-2")

---

## Permission Requirements

| Operation                   | Required Permission                  |
| --------------------------- | ------------------------------------ |
| Create                      | `CREATE_FUNNELS` or Owner/Admin role |
| View                        | Workspace member                     |
| Update                      | `EDIT_FUNNELS` or Owner/Admin role   |
| Delete                      | `DELETE_FUNNELS` or Owner/Admin role |
| Duplicate (same workspace)  | `CREATE_FUNNELS`                     |
| Duplicate (cross-workspace) | View source + Create in target       |
