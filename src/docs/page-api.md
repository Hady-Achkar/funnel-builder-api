# Page API Documentation

## Overview

Page management routes for funnel builder. Most routes require authentication except public page viewing.
All authenticated routes require `authenticateToken` middleware unless specified as public.

---

## 1. Create Page

**Route:** `POST /api/pages/funnels/:funnelId/pages`  
**Authentication:** Required

### URL Parameters

| Field      | Type   | Required | Description      |
| ---------- | ------ | -------- | ---------------- |
| `funnelId` | number | Yes      | Parent funnel ID |

### Request Body

| Field     | Type   | Required | Default                 | Description               |
| --------- | ------ | -------- | ----------------------- | ------------------------- |
| `name`    | string | No       | Auto-generated "Page X" | Page name (max 255 chars) |
| `content` | string | No       | "" (empty)              | Page content/HTML         |

### Response

```json
{
  "message": "Page created successfully",
  "pageId": 456
}
```

### Notes

- Auto-generates name as "Page X" where X is the next order number
- Auto-generates unique linking ID from name
- Sets order as last page + 1
- Updates both page cache and funnel cache
- Requires EDIT_PAGES permission in workspace

---

## 2. Get Page

**Route:** `GET /api/pages/:id`  
**Authentication:** Required

### URL Parameters

| Field | Type   | Required | Description         |
| ----- | ------ | -------- | ------------------- |
| `id`  | number | Yes      | Page ID to retrieve |

### Response

```json
{
  "id": 456,
  "name": "Home",
  "content": "<!-- Page HTML content -->",
  "order": 1,
  "linkingId": "home",
  "seoTitle": "Welcome Home",
  "seoDescription": "Landing page description",
  "seoKeywords": null,
  "funnelId": 123,
  "createdAt": "2025-08-23T10:00:00.000Z",
  "updatedAt": "2025-08-23T10:00:00.000Z"
}
```

### Notes

- **Cache-first approach**: Checks cache before database
- Returns full page content
- Requires view permissions for parent funnel
- Caches result if not already cached

---

## 3. Get Public Page

**Route:** `GET /api/pages/funnel/:funnelSlug/page/:linkingId`  
**Authentication:** Not required (Public)

### URL Parameters

| Field        | Type   | Required | Description                       |
| ------------ | ------ | -------- | --------------------------------- |
| `funnelSlug` | string | Yes      | Funnel slug (regex: `[a-z0-9-]+`) |
| `linkingId`  | string | Yes      | Page linking ID                   |

### Response

```json
{
  "id": 456,
  "name": "Home",
  "content": "<!-- Page HTML content -->",
  "order": 1,
  "linkingId": "home",
  "seoTitle": "Welcome Home",
  "seoDescription": "Landing page description",
  "seoKeywords": null,
  "funnelId": 123,
  "createdAt": "2025-08-23T10:00:00.000Z",
  "updatedAt": "2025-08-23T10:00:00.000Z"
}
```

### Notes

- **Public endpoint** - no authentication required
- **Only works if funnel status is `LIVE`**
- Uses cache-first approach
- Slug validation: lowercase letters, numbers, hyphens only
- Returns user-friendly error: "Page not found or not publicly accessible"

---

## 4. Update Page

**Route:** `PUT /api/pages/:id`  
**Authentication:** Required

### URL Parameters

| Field | Type   | Required | Description       |
| ----- | ------ | -------- | ----------------- |
| `id`  | number | Yes      | Page ID to update |

### Request Body

| Field            | Type   | Required | Description                                         |
| ---------------- | ------ | -------- | --------------------------------------------------- |
| `name`           | string | No       | Page name (max 255 chars, generates new linking ID) |
| `content`        | string | No       | Page content/HTML                                   |
| `seoTitle`       | string | No       | SEO title (max 60 chars)                            |
| `seoDescription` | string | No       | SEO description (max 160 chars)                     |
| `seoKeywords`    | string | No       | SEO keywords (max 255 chars)                        |

### Response

```json
{
  "message": "Page updated successfully",
  "page": {
    "id": 456,
    "name": "Updated Home",
    "content": "<!-- Updated HTML content -->",
    "order": 1,
    "linkingId": "updated-home",
    "seoTitle": "Updated Title",
    "seoDescription": "Updated description",
    "seoKeywords": "updated, keywords",
    "funnelId": 123,
    "createdAt": "2025-08-23T10:00:00.000Z",
    "updatedAt": "2025-08-23T10:30:00.000Z"
  }
}
```

### Notes

- **Auto-generates linking ID** from name if name is updated
- **Validates name characters**: Only letters, numbers, spaces, underscores, hyphens allowed
- **Checks linking ID uniqueness** within funnel if name changes
- **Partial updates supported**: Only send fields you want to change
- Requires EDIT_PAGES permission in workspace

---

## 5. Delete Page

**Route:** `DELETE /api/pages/:id`  
**Authentication:** Required

### URL Parameters

| Field | Type   | Required | Description       |
| ----- | ------ | -------- | ----------------- |
| `id`  | number | Yes      | Page ID to delete |

### Response

```json
{
  "message": "Page deleted successfully"
}
```

### Notes

- Cannot delete the last page in a funnel
- Automatically reorders remaining pages (decrements order for pages after deleted one)
- Updates both individual page caches and funnel cache
- Requires DELETE_FUNNELS permission or Owner/Admin role

---

## 6. Duplicate Page

**Route:** `POST /api/pages/:pageId/duplicate`  
**Authentication:** Required

### URL Parameters

| Field    | Type   | Required | Description            |
| -------- | ------ | -------- | ---------------------- |
| `pageId` | number | Yes      | Page ID to duplicate   |

### Request Body

| Field           | Type   | Required | Description                                    |
| --------------- | ------ | -------- | ---------------------------------------------- |
| `targetFunnelId` | number | No       | Target funnel ID (defaults to same funnel)    |

### Response

```json
{
  "message": "Page duplicated successfully",
  "pageId": 457
}
```

### Notes

- **Same Funnel Duplication**:
  - Name: Adds "(copy)" suffix
  - Order: Inserts directly after original page (pushes others +1)
  - LinkingId: Adds "-copy" suffix with incremental numbering
  - SEO fields and visits: Set to null
- **Different Funnel Duplication**:
  - Name: Keeps same name
  - Order: Adds as last page in target funnel
  - LinkingId: Generated uniquely for target funnel
  - SEO fields and visits: Set to null
  - Checks user permissions in target workspace
- Requires EDIT_PAGES permission in both source and target funnels

---

## 7. Reorder Pages

**Route:** `PUT /api/pages/funnels/:funnelId/pages/reorder`  
**Authentication:** Required

### URL Parameters

| Field      | Type   | Required | Description      |
| ---------- | ------ | -------- | ---------------- |
| `funnelId` | number | Yes      | Parent funnel ID |

### Request Body

| Field        | Type    | Required | Description                        |
| ------------ | ------- | -------- | ---------------------------------- |
| `pageOrders` | array   | Yes      | Array of page order objects        |
| `pageOrders[].id` | number | Yes | Page ID                       |
| `pageOrders[].order` | number | Yes | New order position (starting from 1) |

### Response

```json
{
  "message": "Pages reordered successfully"
}
```

### Notes

- Must provide order for all pages in the funnel
- Orders must be sequential starting from 1 (no gaps)
- No duplicate order values allowed
- Updates both individual page caches and funnel cache
- Requires EDIT_PAGES permission in workspace

---

## 8. Create Page Visit

**Route:** `POST /api/pages/:pageId/visit`  
**Authentication:** Not required (Public)

### URL Parameters

| Field    | Type   | Required | Description |
| -------- | ------ | -------- | ----------- |
| `pageId` | number | Yes      | Page ID     |

### Request Body

Optional visitor tracking data (implementation specific)

### Response

```json
{
  "message": "Page visit recorded successfully"
}
```

### Notes

- **Public endpoint** - no authentication required
- Records analytics/tracking data for page visits
- Used for funnel performance tracking

---

## Cache Keys

### Primary Keys

- `funnel:{funnelId}:page:{pageId}:full` - Individual page with full content
- `workspace:{workspaceId}:funnel:{funnelId}:full` - Funnel data with pages (without content)

### Cache Operations

| Operation       | Cache Updates                                                          |
| --------------- | ---------------------------------------------------------------------- |
| Create Page     | 1. Creates page cache<br>2. Updates funnel cache (adds to pages array) |
| Get Page        | 1. Reads from cache<br>2. Falls back to DB and creates cache           |
| Get Public Page | 1. Reads from cache<br>2. Falls back to DB and creates cache           |
| Update Page     | 1. Updates page cache<br>2. Invalidates funnel cache (forces refresh)  |
| Delete Page     | 1. Deletes page cache<br>2. Updates funnel cache (removes from pages)  |
| Duplicate Page  | 1. Creates new page cache<br>2. Updates funnel cache (adds new page)   |
| Reorder Pages   | 1. Updates all affected page caches<br>2. Updates funnel cache orders  |

---

## Auto-Generation Rules

### Page Name

- If not provided: "Page {order}"
- Example: "Page 1", "Page 2", "Page 3"

### Linking ID

- Generated from page name
- Converts to lowercase, replaces spaces with hyphens
- Ensures uniqueness within funnel
- Examples:
  - "Home Page" → "home-page"
  - "Contact Us" → "contact-us"
  - "Page 3" → "page-3"
  - Duplicates append number: "home-page-2"

### Page Order

- Automatically set as last page order + 1
- First page gets order = 1
- Reordering maintains sequential numbering starting from 1

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
- **404** - Page or funnel not found
- **409** - Conflict (duplicate linking ID)
- **500** - Server error

### Specific Error Messages

- "User ID is required" - Missing authentication
- "Page not found" - Page doesn't exist
- "Page not found or not publicly accessible" - For public endpoint when funnel isn't LIVE or page doesn't exist
- "You don't have permission to [action] pages" - Insufficient permissions
- "Cannot delete the last page in a funnel" - Delete validation
- "Must provide new order for all pages in the funnel" - Reorder validation

---

## Permission Requirements

| Operation       | Required Permission                           |
| --------------- | --------------------------------------------- |
| Create Page     | `EDIT_FUNNELS` or `EDIT_PAGES` or Owner/Admin role |
| Get Page        | View access to parent funnel                  |
| Get Public Page | None (but funnel must be LIVE)                |
| Update Page     | `EDIT_FUNNELS` or `EDIT_PAGES` or Owner/Admin role |
| Delete Page     | `DELETE_FUNNELS` or Owner/Admin role          |
| Duplicate Page  | `EDIT_FUNNELS` or `EDIT_PAGES` or Owner/Admin role |
| Reorder Pages   | `EDIT_FUNNELS` or `EDIT_PAGES` or Owner/Admin role |
| Create Visit    | None (public endpoint)                        |

---

## Validation Rules

### Page Name

- Maximum 255 characters
- Only letters, numbers, spaces, underscores, hyphens allowed
- Cannot contain special characters (@, #, $, etc.)

### Linking ID

- Auto-generated from name
- Must be unique within funnel
- URL-safe format (lowercase, hyphens)

### SEO Fields

- SEO title: Maximum 60 characters (optimal for search results)
- SEO description: Maximum 160 characters (optimal for search snippets)
- SEO keywords: Maximum 255 characters

### Order Values

- Must be positive integers
- Sequential starting from 1 (no gaps)
- No duplicate values within funnel