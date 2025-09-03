# Image API Documentation

## Overview

Image management system for the funnel builder platform. Handles image upload, deletion, updates, and organization within folders. Supports multiple image formats with file validation, Azure Blob Storage integration, and Redis caching for optimal performance.

All routes require `authenticateToken` middleware for user authentication and workspace-based permissions.

---

## Image Management Routes

### 1. Upload Images

**Route:** `POST /api/images/folder/:folderId`  
**Authentication:** Required  
**Content-Type:** `multipart/form-data`

Uploads multiple images to a specified folder. Supports batch upload with file validation and automatic filename sanitization.

### Path Parameters

| Parameter  | Type   | Required | Description                    |
| ---------- | ------ | -------- | ------------------------------ |
| `folderId` | string | Yes      | Target folder ID (positive integer) |

### Request Body (Form Data)

| Field    | Type  | Required | Description                    |
| -------- | ----- | -------- | ------------------------------ |
| `images` | files | Yes      | Array of image files (max 10) |

### File Validation

- **Supported formats:** JPEG, JPG, PNG, GIF, WebP, SVG
- **Max file size:** 5MB per image
- **Max files:** 10 images per request
- **Filename sanitization:** Special characters replaced with hyphens

### Response

```json
{
  "message": "Images uploaded successfully"
}
```

### Error Examples

```json
// No files provided
{
  "error": "No files provided",
  "statusCode": 400
}

// Invalid file type
{
  "error": "Invalid file type: application/pdf. Only image files are allowed.",
  "statusCode": 400
}

// File too large
{
  "error": "File image.jpg exceeds 5MB limit.",
  "statusCode": 400
}

// Too many files
{
  "error": "Maximum 10 images can be uploaded at once",
  "statusCode": 400
}
```

---

### 2. Delete Image

**Route:** `DELETE /api/images/:imageId`  
**Authentication:** Required

Deletes a single image from the system, including removal from Azure Blob Storage and cache invalidation.

### Path Parameters

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `imageId` | string | Yes      | Image ID to delete (positive integer) |

### Response

```json
{
  "message": "Image deleted successfully"
}
```

### Error Examples

```json
// Image not found
{
  "error": "Image not found",
  "statusCode": 404
}

// Unauthorized access
{
  "error": "Unauthorized to delete this image",
  "statusCode": 401
}
```

---

### 3. Bulk Delete Images

**Route:** `DELETE /api/images/bulk`  
**Authentication:** Required

Deletes multiple images in a single request with detailed success/failure reporting.

### Request Body

| Field      | Type     | Required | Description                    |
| ---------- | -------- | -------- | ------------------------------ |
| `imageIds` | number[] | Yes      | Array of image IDs to delete (1-50 items) |

### Validation Rules

- **Array length:** 1-50 image IDs
- **Unique IDs:** Duplicate IDs not allowed
- **ID format:** Each ID must be positive integer
- **User permission:** User must own all images in the request

### Response

```json
{
  "message": "Successfully deleted 3 image(s)",
  "deletedCount": 3,
  "failedIds": [456],
  "errors": ["Failed to delete image 456: Azure storage error"]
}
```

### Error Examples

```json
// Too many images
{
  "error": "Cannot delete more than 50 images at once",
  "statusCode": 400
}

// Duplicate IDs
{
  "error": "Duplicate image IDs are not allowed",
  "statusCode": 400
}

// No images found
{
  "error": "No images found with the provided IDs",
  "statusCode": 404
}
```

---

### 4. Update Image

**Route:** `PUT /api/images/:imageId`  
**Authentication:** Required  
**Content-Type:** `multipart/form-data`

Updates image metadata and/or replaces the image file. Supports partial updates with file replacement.

### Path Parameters

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `imageId` | string | Yes      | Image ID to update (positive integer) |

### Request Body (Form Data)

| Field     | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `name`    | string | No       | New image name |
| `altText` | string | No       | Alternative text for accessibility |
| `image`   | file   | No       | New image file (replaces existing) |

### File Validation (if image provided)

- **Supported formats:** JPEG, JPG, PNG, GIF, WebP, SVG
- **Max file size:** 5MB
- **Overwrite behavior:** Replaces existing file at same Azure path

### Response

```json
{
  "message": "Image updated successfully"
}
```

### Error Examples

```json
// No updates provided
{
  "error": "At least one field (image, name, or altText) must be provided",
  "statusCode": 400
}

// File too large
{
  "error": "File exceeds 5MB limit.",
  "statusCode": 400
}

// Unauthorized access
{
  "error": "Unauthorized to update this image",
  "statusCode": 401
}
```

---

### 5. Move Image

**Route:** `PATCH /api/images/:imageId/move`  
**Authentication:** Required

Moves an image from one folder to another with cache synchronization.

### Path Parameters

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `imageId` | string | Yes      | Image ID to move (positive integer) |

### Request Body

| Field            | Type            | Required | Description                    |
| ---------------- | --------------- | -------- | ------------------------------ |
| `targetFolderId` | number\|string  | Yes      | Destination folder ID (positive integer) |

### Response

```json
{
  "message": "Image moved successfully"
}
```

### Error Examples

```json
// Target folder not found
{
  "error": "Target folder not found",
  "statusCode": 404
}

// Same folder
{
  "error": "Image is already in the target folder",
  "statusCode": 400
}

// Unauthorized access
{
  "error": "Unauthorized to move this image",
  "statusCode": 401
}
```

---

## Data Models

### Image Object

```typescript
interface Image {
  id: number;
  name: string;
  url: string;
  altText: string | null;
  size: number;
  folderId: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Folder Relationship

Images belong to folders which belong to users. Authorization is enforced through the folder ownership chain.

---

## Technical Implementation

### File Storage

- **Provider:** Azure Blob Storage
- **Container:** template-images
- **Path structure:** `images/user-{userId}/folder-{folderId}/{filename}`
- **Filename format:** `{sanitized-name}-{timestamp}-{random-id}.{extension}`

### Caching Strategy

- **Provider:** Redis
- **Cache key:** `user:{userId}:folder:{folderId}:full`
- **Update strategy:** Automatic cache invalidation on all operations
- **Fallback:** Database query if cache miss

### Error Handling

- **Validation:** Zod schemas for request validation
- **File errors:** Graceful handling of Azure storage failures
- **Transactions:** Database operations wrapped in transactions
- **Rollback:** Automatic cleanup on operation failures

### Security Features

- **Authentication:** JWT token required for all endpoints
- **Authorization:** Folder ownership verification
- **File validation:** MIME type and size restrictions
- **Path traversal:** Sanitized filenames prevent directory attacks
- **Rate limiting:** Applied at application level

---

## Integration Examples

### JavaScript/TypeScript

```javascript
// Upload images
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);

const response = await fetch('/api/images/folder/123', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

// Bulk delete
await fetch('/api/images/bulk', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    imageIds: [1, 2, 3]
  })
});

// Move image
await fetch('/api/images/456/move', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    targetFolderId: 789
  })
});
```

### cURL Examples

```bash
# Upload images
curl -X POST "https://api.example.com/api/images/folder/123" \
  -H "Authorization: Bearer your_token" \
  -F "images=@image1.jpg" \
  -F "images=@image2.png"

# Delete single image
curl -X DELETE "https://api.example.com/api/images/456" \
  -H "Authorization: Bearer your_token"

# Bulk delete
curl -X DELETE "https://api.example.com/api/images/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{"imageIds": [1, 2, 3]}'

# Update image metadata
curl -X PUT "https://api.example.com/api/images/456" \
  -H "Authorization: Bearer your_token" \
  -F "name=Updated Image Name" \
  -F "altText=Updated alt text"

# Move image
curl -X PATCH "https://api.example.com/api/images/456/move" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{"targetFolderId": 789}'
```