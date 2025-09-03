# Template API Documentation

## Overview

Template management routes for funnel builder. Public routes allow browsing available templates, while authenticated routes allow template creation, updates, and management.
Most routes require authentication via `authenticateToken` middleware unless specified as public.

---

## 1. Get All Templates

**Route:** `GET /api/templates`  
**Authentication:** Not required (Public)

### Query Parameters

| Field      | Type   | Required | Default     | Description                               |
| ---------- | ------ | -------- | ----------- | ----------------------------------------- |
| `page`     | number | No       | 1           | Page number (minimum 1)                  |
| `limit`    | number | No       | 10          | Items per page (1-50)                    |
| `orderBy`  | enum   | No       | `createdAt` | createdAt, updatedAt, name, usageCount   |
| `order`    | enum   | No       | `desc`      | asc, desc                                |
| `category` | string | No       | -           | Filter by category slug                  |

### Response

```json
{
  "success": true,
  "message": "Templates retrieved successfully",
  "data": {
    "templates": [
      {
        "id": 1,
        "name": "Landing Page Pro",
        "slug": "landing-page-pro",
        "description": "Professional landing page template",
        "categoryId": 1,
        "categoryName": "Business",
        "tags": ["landing", "business", "professional"],
        "createdByUserId": 2,
        "usageCount": 15,
        "pagesCount": 3,
        "thumbnailUrl": "https://storage.blob.../thumbnail.jpg",
        "previewUrls": [
          "https://storage.blob.../preview1.jpg",
          "https://storage.blob.../preview2.jpg"
        ],
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "orderBy": "createdAt",
      "order": "desc",
      "category": "business"
    }
  }
}
```

### Notes

- **Public endpoint** - no authentication required
- **Only returns active and public templates**
- Templates include summary data without full content
- **Pagination**: Maximum 50 items per page
- **Filtering**: By category slug (e.g., "business", "portfolio")
- **Sorting**: Multiple options for ordering results

---

## 2. Get Template by ID

**Route:** `GET /api/templates/:id`  
**Authentication:** Not required (Public)

### URL Parameters

| Field | Type   | Required | Description            |
| ----- | ------ | -------- | ---------------------- |
| `id`  | number | Yes      | Template ID to retrieve |

### Response

```json
{
  "success": true,
  "message": "Template retrieved successfully",
  "data": {
    "id": 1,
    "name": "Landing Page Pro",
    "slug": "landing-page-pro",
    "description": "Professional landing page template",
    "categoryId": 1,
    "category": {
      "id": 1,
      "name": "Business",
      "slug": "business"
    },
    "tags": ["landing", "business", "professional"],
    "isActive": true,
    "isPublic": true,
    "createdByUserId": 2,
    "usageCount": 15,
    "pages": [
      {
        "id": 1,
        "name": "Home",
        "content": "<!-- Template HTML content -->",
        "order": 1,
        "linkingId": "home",
        "seoTitle": "Professional Landing Page",
        "seoDescription": "Convert visitors with this professional template",
        "seoKeywords": "landing, conversion, business",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "previewImages": [
      {
        "id": 1,
        "imageUrl": "https://storage.blob.../thumbnail.jpg",
        "imageType": "THUMBNAIL",
        "caption": "Main preview",
        "order": 0
      },
      {
        "id": 2,
        "imageUrl": "https://storage.blob.../preview1.jpg",
        "imageType": "PREVIEW",
        "caption": "Desktop view",
        "order": 1
      }
    ],
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### Notes

- **Public endpoint** - no authentication required
- **Only returns active and public templates**
- **Cache-first approach**: Checks cache before database
- Returns full template content including pages and preview images
- **Preview images**: Includes both THUMBNAIL and PREVIEW types

---

## 3. Create Template from Funnel

**Route:** `POST /api/templates/from-funnel`  
**Authentication:** Required

### Request Body (Multipart/Form-Data)

| Field             | Type   | Required | Default | Description                              |
| ----------------- | ------ | -------- | ------- | ---------------------------------------- |
| `name`            | string | Yes      | -       | Template name (max 255 chars)           |
| `description`     | string | No       | null    | Template description (max 1000 chars)   |
| `categoryId`      | number | Yes      | -       | Template category ID                     |
| `funnelId`        | number | Yes      | -       | Source funnel ID to create template from |
| `tags`            | array  | No       | []      | Array of tags (max 10)                  |
| `isPublic`        | boolean| No       | true    | Whether template is publicly visible    |
| `isActive`        | boolean| No       | true    | Whether template is active               |
| `thumbnail`       | file   | Yes      | -       | Thumbnail image (max 5MB)               |
| `preview_images`  | files  | No       | []      | Preview images (max 10 files, 10MB each)|

### Response

```json
{
  "success": true,
  "message": "Template created successfully from funnel 'Marketing Funnel' in workspace 'My Business'"
}
```

### Notes

- **Requires authentication and workspace permissions**
- **Creates template from existing funnel**: Copies funnel structure and pages
- **Image uploads**: Uploads to Azure Blob Storage automatically
- **Linking ID replacement**: Updates internal linking IDs for template use
- **Workspace validation**: User must have access to source funnel
- **File validation**: Images validated for size, type, and format
- **Auto-generates slug** from template name with uniqueness check

---

## 4. Update Template

**Route:** `PUT /api/templates/:id`  
**Authentication:** Required

### URL Parameters

| Field | Type   | Required | Description          |
| ----- | ------ | -------- | -------------------- |
| `id`  | number | Yes      | Template ID to update |

### Request Body (Multipart/Form-Data)

| Field         | Type    | Required | Description                              |
| ------------- | ------- | -------- | ---------------------------------------- |
| `name`        | string  | No       | Template name (max 255 chars)           |
| `slug`        | string  | No       | URL-friendly identifier                  |
| `description` | string  | No       | Template description (max 1000 chars)   |
| `categoryId`  | number  | No       | Template category ID                     |
| `tags`        | array   | No       | Array of tags (max 10)                  |
| `isActive`    | boolean | No       | Whether template is active               |
| `isPublic`    | boolean | No       | Whether template is publicly visible    |
| `thumbnail`   | file    | No       | New thumbnail image (max 5MB)           |
| `images`      | files   | No       | New preview images (max 10 files, 10MB each) |

### Response

```json
{
  "success": true,
  "message": "Template updated successfully"
}
```

### Notes

- **Requires authentication and ownership**: Only template creator can update
- **Partial updates supported**: Only send fields you want to change
- **Image replacement**: New images replace all existing images
- **Slug validation**: Must be unique if provided
- **Cache invalidation**: Updates both full and summary cache keys
- **Azure Blob Storage**: New images uploaded to cloud storage

---

## 5. Delete Template

**Route:** `DELETE /api/templates/:id`  
**Authentication:** Required

### URL Parameters

| Field | Type   | Required | Description          |
| ----- | ------ | -------- | -------------------- |
| `id`  | number | Yes      | Template ID to delete |

### Response

```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

### Notes

- **Requires authentication and ownership**: Only template creator can delete
- **Cascading delete**: Removes all associated template pages and images
- **Cloud storage cleanup**: Deletes images from Azure Blob Storage
- **Cache invalidation**: Clears all cached template data
- **Permanent action**: Cannot be undone

---

## Cache Keys

### Primary Keys

- `template:{templateId}:full` - Full template with pages and preview images
- `template:{templateId}:summary` - Template summary for listings

### Cache Operations

| Operation        | Cache Updates                                                    |
| ---------------- | ---------------------------------------------------------------- |
| Get All Templates| Reads from summary cache, falls back to DB                      |
| Get Template     | Reads from full cache, falls back to DB and creates cache       |
| Create Template  | Creates both full and summary cache entries                     |
| Update Template  | Updates both full and summary cache entries                     |
| Delete Template  | Deletes all template cache entries                              |

---

## Auto-Generation Rules

### Template Slug

- Generated from template name if not provided
- Converts to lowercase, replaces spaces with hyphens
- Ensures uniqueness globally across all templates
- Examples:
  - "Landing Page Pro" → "landing-page-pro"
  - "E-commerce Store" → "e-commerce-store"
  - Duplicates append number: "landing-page-pro-2"

### Linking ID Replacement

- When creating template from funnel, internal linking IDs are replaced
- Ensures template links work independently of source funnel
- Maintains page relationships within the template

---

## Image Upload Requirements

### Thumbnail Image

- **Required** for template creation
- **Format**: JPEG, JPG, PNG, GIF, WebP, SVG
- **Size**: Maximum 5MB
- **Aspect Ratio**: Recommended 16:9 or 4:3
- **Storage**: Uploaded to Azure Blob Storage

### Preview Images

- **Optional**: Up to 10 images
- **Format**: JPEG, JPG, PNG, GIF, WebP, SVG
- **Size**: Maximum 10MB each
- **Purpose**: Show template variations and responsive views
- **Storage**: Uploaded to Azure Blob Storage

### Image Naming Convention

```
Thumbnails: template-{id}-thumbnail-{timestamp}-{random}.{ext}
Previews: template-{id}-preview-{index}-{timestamp}-{random}.{ext}
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error message here"
}
```

### Common Errors

- **400** - Invalid input, validation errors, file upload issues
- **401** - Authentication required
- **403** - Insufficient permissions, not template owner
- **404** - Template or funnel not found
- **409** - Conflict (duplicate slug)
- **413** - File too large
- **500** - Server error

### Specific Error Messages

- "Template not found" - Template doesn't exist or isn't public
- "Funnel not found" - Source funnel for template creation doesn't exist
- "Thumbnail image is required" - Missing required thumbnail
- "File size exceeds maximum allowed size" - Image too large
- "Invalid file type" - Unsupported image format
- "Maximum 10 preview images are allowed" - Too many preview images
- "Template slug must be unique" - Duplicate slug provided

---

## Permission Requirements

| Operation         | Required Permission                  |
| ----------------- | ------------------------------------ |
| Get All Templates | None (public endpoint)               |
| Get Template      | None (public endpoint, active/public only) |
| Create Template   | Authentication + funnel access       |
| Update Template   | Authentication + template ownership  |
| Delete Template   | Authentication + template ownership  |

---

## Validation Rules

### Template Name

- **Required** for creation
- Maximum 255 characters
- Cannot be empty (after trimming)
- No special character restrictions

### Template Description

- **Optional**
- Maximum 1000 characters
- Can include markdown or HTML

### Template Slug

- Auto-generated if not provided
- Must be unique globally
- URL-safe format (lowercase, hyphens)
- Cannot contain special characters

### Tags

- **Optional** array of strings
- Maximum 10 tags
- Each tag cannot be empty
- Tags are trimmed of whitespace

### Category ID

- **Required** for creation
- Must reference existing template category
- Must be positive number

---

## Usage Examples

### Create Template with Images

```bash
curl -X POST http://localhost:4444/api/templates/from-funnel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=My Landing Page" \
  -F "description=Professional landing page template" \
  -F "categoryId=1" \
  -F "funnelId=5" \
  -F "tags=[\"landing\",\"business\"]" \
  -F "isPublic=true" \
  -F "thumbnail=@thumbnail.jpg" \
  -F "preview_images=@preview1.jpg" \
  -F "preview_images=@preview2.jpg"
```

### Update Template

```bash
curl -X PUT http://localhost:4444/api/templates/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Updated Template Name" \
  -F "isActive=false" \
  -F "thumbnail=@new_thumbnail.jpg"
```

### Get Templates with Filters

```bash
curl "http://localhost:4444/api/templates?category=business&orderBy=usageCount&order=desc&limit=20"
```