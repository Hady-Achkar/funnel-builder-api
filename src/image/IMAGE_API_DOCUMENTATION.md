# Image Management API Documentation

## Overview

Complete image and image folder management system for funnel builder. Supports organized storage of images in folders with full CRUD operations, bulk operations, and cloud storage integration.
All routes require authentication via `authenticateToken` middleware.

---

# Image Folder Management

## 1. Create Image Folder

**Route:** `POST /api/image-folders`  
**Authentication:** Required

### Request Body

| Field  | Type   | Required | Description                        |
| ------ | ------ | -------- | ---------------------------------- |
| `name` | string | Yes      | Folder name (max 100 chars)       |

### Response

```json
{
  "success": true,
  "message": "Image folder created successfully",
  "folderId": 1
}
```

### Notes

- **Folder names must be unique** per user
- **Automatic ownership**: Folder belongs to authenticated user
- **Validation**: Name cannot be empty after trimming

---

## 2. Get User Image Folders

**Route:** `GET /api/image-folders`  
**Authentication:** Required

### Response

```json
{
  "success": true,
  "data": {
    "folders": [
      {
        "id": 1,
        "name": "Product Photos",
        "userId": 123,
        "imageCount": 15,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      },
      {
        "id": 2,
        "name": "Hero Images",
        "userId": 123,
        "imageCount": 8,
        "createdAt": "2024-01-16T09:30:00.000Z",
        "updatedAt": "2024-01-16T09:30:00.000Z"
      }
    ]
  }
}
```

### Notes

- **Returns only folders owned by authenticated user**
- **Includes image count** for each folder
- **Sorted by creation date** (newest first)

---

## 3. Get Image Folder by ID

**Route:** `GET /api/image-folders/:id`  
**Authentication:** Required

### URL Parameters

| Field | Type   | Required | Description           |
| ----- | ------ | -------- | --------------------- |
| `id`  | number | Yes      | Folder ID to retrieve |

### Response

```json
{
  "success": true,
  "data": {
    "folder": {
      "id": 1,
      "name": "Product Photos",
      "userId": 123,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "images": [
        {
          "id": 10,
          "filename": "product-hero.jpg",
          "originalName": "Product Hero Image.jpg",
          "url": "https://storage.blob.../product-hero.jpg",
          "size": 2048576,
          "mimeType": "image/jpeg",
          "folderId": 1,
          "userId": 123,
          "createdAt": "2024-01-15T11:00:00.000Z",
          "updatedAt": "2024-01-15T11:00:00.000Z"
        }
      ]
    }
  }
}
```

### Notes

- **Ownership validation**: Only returns folders owned by authenticated user
- **Includes all images** in the folder
- **Full image metadata** including URLs and file information

---

## 4. Update Image Folder

**Route:** `PUT /api/image-folders/:id`  
**Authentication:** Required

### URL Parameters

| Field | Type   | Required | Description         |
| ----- | ------ | -------- | ------------------- |
| `id`  | number | Yes      | Folder ID to update |

### Request Body

| Field  | Type   | Required | Description                  |
| ------ | ------ | -------- | ---------------------------- |
| `name` | string | Yes      | New folder name (max 100 chars) |

### Response

```json
{
  "success": true,
  "message": "Image folder updated successfully"
}
```

### Notes

- **Ownership validation**: Only folder owner can update
- **Unique name validation**: New name must be unique for the user
- **Non-empty validation**: Name cannot be empty after trimming

---

## 5. Delete Image Folder

**Route:** `DELETE /api/image-folders/:id`  
**Authentication:** Required

### URL Parameters

| Field | Type   | Required | Description         |
| ----- | ------ | -------- | ------------------- |
| `id`  | number | Yes      | Folder ID to delete |

### Response

```json
{
  "success": true,
  "message": "Image folder deleted successfully"
}
```

### Notes

- **Ownership validation**: Only folder owner can delete
- **Cascading delete**: Removes all images in the folder
- **Cloud storage cleanup**: Deletes all image files from Azure Blob Storage
- **Permanent action**: Cannot be undone

---

# Image Management

## 6. Upload Images

**Route:** `POST /api/images/folder/:folderId`  
**Authentication:** Required

### URL Parameters

| Field      | Type   | Required | Description                   |
| ---------- | ------ | -------- | ----------------------------- |
| `folderId` | number | Yes      | Target folder ID for images   |

### Request Body (Multipart/Form-Data)

| Field    | Type  | Required | Description                          |
| -------- | ----- | -------- | ------------------------------------ |
| `images` | files | Yes      | Array of image files to upload       |

### Response

```json
{
  "success": true,
  "message": "5 images uploaded successfully",
  "data": {
    "uploaded": [
      {
        "id": 15,
        "filename": "hero-image-1642-abc123.jpg",
        "originalName": "Hero Image.jpg",
        "url": "https://storage.blob.../hero-image-1642-abc123.jpg",
        "size": 2048576,
        "mimeType": "image/jpeg",
        "folderId": 1,
        "userId": 123,
        "createdAt": "2024-01-15T12:00:00.000Z"
      }
    ],
    "failed": []
  }
}
```

### Notes

- **Folder ownership validation**: Must own the target folder
- **Multiple file support**: Upload multiple images in single request
- **Azure Blob Storage**: Files uploaded to cloud storage
- **File validation**: Size, type, and format validation
- **Unique filenames**: Automatic timestamp and random string generation
- **Atomic operation**: All files uploaded or none (transaction-safe)

---

## 7. Update Image

**Route:** `PUT /api/images/:imageId`  
**Authentication:** Required

### URL Parameters

| Field     | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| `imageId` | number | Yes      | Image ID to update |

### Request Body

| Field          | Type   | Required | Description                    |
| -------------- | ------ | -------- | ------------------------------ |
| `filename`     | string | No       | New filename (without extension) |
| `originalName` | string | No       | New display name               |

### Response

```json
{
  "success": true,
  "message": "Image updated successfully",
  "data": {
    "image": {
      "id": 15,
      "filename": "updated-hero-image.jpg",
      "originalName": "Updated Hero Image.jpg",
      "url": "https://storage.blob.../updated-hero-image.jpg",
      "size": 2048576,
      "mimeType": "image/jpeg",
      "folderId": 1,
      "userId": 123,
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T13:00:00.000Z"
    }
  }
}
```

### Notes

- **Ownership validation**: Only image owner can update
- **Partial updates**: Only send fields you want to change
- **Filename validation**: Must be valid filename without extension
- **Cloud storage sync**: URL updated if filename changes

---

## 8. Move Image

**Route:** `PUT /api/images/:imageId/move`  
**Authentication:** Required

### URL Parameters

| Field     | Type   | Required | Description       |
| --------- | ------ | -------- | ----------------- |
| `imageId` | number | Yes      | Image ID to move  |

### Request Body

| Field           | Type   | Required | Description                  |
| --------------- | ------ | -------- | ---------------------------- |
| `targetFolderId` | number | Yes      | Target folder ID to move to  |

### Response

```json
{
  "success": true,
  "message": "Image moved successfully",
  "data": {
    "image": {
      "id": 15,
      "filename": "hero-image.jpg",
      "originalName": "Hero Image.jpg",
      "url": "https://storage.blob.../hero-image.jpg",
      "folderId": 2,
      "userId": 123,
      "updatedAt": "2024-01-15T14:00:00.000Z"
    }
  }
}
```

### Notes

- **Dual ownership validation**: Must own both image and target folder
- **Folder existence check**: Target folder must exist
- **Atomic operation**: Move is transaction-safe
- **Preserves metadata**: Only folder association changes

---

## 9. Delete Image

**Route:** `DELETE /api/images/:imageId`  
**Authentication:** Required

### URL Parameters

| Field     | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| `imageId` | number | Yes      | Image ID to delete |

### Response

```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### Notes

- **Ownership validation**: Only image owner can delete
- **Cloud storage cleanup**: Removes file from Azure Blob Storage
- **Permanent action**: Cannot be undone
- **Graceful failure**: Continues even if cloud deletion fails

---

## 10. Bulk Delete Images

**Route:** `DELETE /api/images/bulk`  
**Authentication:** Required

### Request Body

| Field      | Type     | Required | Description                    |
| ---------- | -------- | -------- | ------------------------------ |
| `imageIds` | number[] | Yes      | Array of image IDs to delete   |

### Response

```json
{
  "success": true,
  "message": "Bulk delete completed",
  "data": {
    "deleted": [15, 16, 17],
    "failed": [],
    "summary": {
      "requested": 3,
      "deleted": 3,
      "failed": 0
    }
  }
}
```

### Notes

- **Batch ownership validation**: Must own all specified images
- **Partial success handling**: Some images may fail while others succeed
- **Cloud storage cleanup**: Removes all files from Azure Blob Storage
- **Detailed reporting**: Shows exactly which images were processed
- **Transaction safety**: Database operations are atomic per image

---

## File Upload Requirements

### Supported Formats

- **JPEG/JPG**: Standard web format
- **PNG**: With transparency support  
- **GIF**: Including animated GIFs
- **WebP**: Modern web format
- **SVG**: Vector graphics
- **BMP**: Bitmap format

### Size Limits

- **Maximum file size**: 10MB per image
- **Recommended size**: Under 5MB for optimal performance
- **Bulk upload**: No limit on number of files per request

### File Validation

- **MIME type checking**: Server validates actual file content
- **Extension validation**: Filename extension must match content
- **Malicious file detection**: Basic security scanning
- **Size verification**: File size validated on server

### Cloud Storage

- **Azure Blob Storage**: All images stored in cloud
- **CDN Integration**: Fast global delivery
- **Automatic backup**: Built-in redundancy
- **Secure URLs**: HTTPS-only image URLs

---

## Auto-Generation Rules

### Image Filenames

- **Pattern**: `{original-name}-{timestamp}-{random}.{extension}`
- **Timestamp**: Unix timestamp for uniqueness
- **Random**: 6-character random string
- **Examples**:
  - "hero-image.jpg" → "hero-image-1642123456-abc123.jpg"
  - "logo.png" → "logo-1642123456-def456.png"

### Folder Organization

- **User isolation**: Each user's folders are completely separate
- **Unique names**: Folder names must be unique per user
- **Hierarchy**: Single-level folder structure (no nested folders)

---

## Cache Strategy

### Image Folder Cache

- **Key Pattern**: `user:{userId}:folders`
- **TTL**: 1 hour
- **Invalidation**: On folder create, update, delete

### Image Metadata Cache

- **Key Pattern**: `user:{userId}:folder:{folderId}:images`
- **TTL**: 30 minutes
- **Invalidation**: On image upload, move, delete, update

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error message here"
}
```

### Common Errors

- **400** - Invalid input, file validation errors, malformed request
- **401** - Authentication required or invalid token
- **403** - Insufficient permissions, not resource owner
- **404** - Folder or image not found
- **413** - File too large or too many files
- **415** - Unsupported file type or invalid format
- **500** - Server error, cloud storage issues

### Specific Error Messages

#### Folder Errors
- "Folder name cannot be empty" - Empty folder name provided
- "Folder name must be less than 100 characters" - Name too long
- "Folder with this name already exists" - Duplicate folder name
- "Folder not found" - Folder doesn't exist or not owned by user

#### Image Errors
- "No images provided" - Upload request without files
- "File size exceeds maximum allowed size of 10MB" - File too large
- "Invalid file type. Supported: JPEG, PNG, GIF, WebP, SVG, BMP" - Unsupported format
- "Image not found" - Image doesn't exist or not owned by user
- "Target folder not found" - Move target folder doesn't exist

#### Permission Errors
- "You don't have permission to access this folder" - Folder ownership validation
- "You don't have permission to modify this image" - Image ownership validation
- "Authentication required" - Missing or invalid auth token

---

## Security Features

### Access Control

- **User isolation**: Users can only access their own images and folders
- **Ownership validation**: All operations verify resource ownership
- **Authentication required**: No public access to any endpoints

### File Security

- **Content validation**: Files validated beyond just extension
- **Size limits**: Prevents abuse and storage exhaustion
- **MIME type verification**: Ensures files are actually images
- **Malicious content scanning**: Basic security checks

### Data Protection

- **Secure deletion**: Files removed from both database and cloud storage
- **Transaction safety**: Database operations use transactions where appropriate
- **Error handling**: Graceful failure without exposing sensitive information

---

## Usage Examples

### Create Folder and Upload Images

```bash
# Create folder
curl -X POST http://localhost:4444/api/image-folders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Product Photos"}'

# Upload images to folder
curl -X POST http://localhost:4444/api/images/folder/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@hero-image.jpg" \
  -F "images=@product-1.jpg" \
  -F "images=@product-2.jpg"
```

### Move Image Between Folders

```bash
curl -X PUT http://localhost:4444/api/images/15/move \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetFolderId": 2}'
```

### Bulk Delete Images

```bash
curl -X DELETE http://localhost:4444/api/images/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageIds": [15, 16, 17, 18]}'
```

### Get All Folders with Images

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4444/api/image-folders
```