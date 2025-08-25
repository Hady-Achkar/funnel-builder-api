# Image Folder API Documentation

## Overview

Image folder management system for organizing images in the funnel builder. Provides complete CRUD operations for folder management with user isolation and validation.
All routes require authentication via `authenticateToken` middleware.

---

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
- **Immediate reference**: Returns folder ID for subsequent operations
- **Cache initialization**: Folder is cached upon creation

### Example

```bash
curl -X POST http://localhost:4444/api/image-folders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Product Photos"}'
```

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
- **Includes image count** for each folder (calculated dynamically)
- **Sorted by creation date** (newest first)
- **Cache-first approach**: Uses cached data when available
- **Empty folders included**: Shows all folders regardless of image count

### Example

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4444/api/image-folders
```

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
          "filename": "product-hero-1642-abc123.jpg",
          "originalName": "Product Hero Image.jpg",
          "url": "https://storage.blob.core.windows.net/images/product-hero-1642-abc123.jpg",
          "size": 2048576,
          "mimeType": "image/jpeg",
          "folderId": 1,
          "userId": 123,
          "createdAt": "2024-01-15T11:00:00.000Z",
          "updatedAt": "2024-01-15T11:00:00.000Z"
        },
        {
          "id": 11,
          "filename": "product-thumbnail-1642-def456.jpg",
          "originalName": "Product Thumbnail.jpg",
          "url": "https://storage.blob.core.windows.net/images/product-thumbnail-1642-def456.jpg",
          "size": 1024768,
          "mimeType": "image/jpeg",
          "folderId": 1,
          "userId": 123,
          "createdAt": "2024-01-15T11:30:00.000Z",
          "updatedAt": "2024-01-15T11:30:00.000Z"
        }
      ]
    }
  }
}
```

### Notes

- **Ownership validation**: Only returns folders owned by authenticated user
- **Includes all images** in the folder with complete metadata
- **Full image metadata**: URLs, file sizes, upload dates, and original names
- **Cache-first approach**: Checks cache before database
- **Auto-caching**: Creates cache entry if not already cached
- **Images sorted by creation date** (newest first)

### Example

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4444/api/image-folders/1
```

---

## 4. Update Image Folder

**Route:** `PUT /api/image-folders/:id`  
**Authentication:** Required

### URL Parameters

| Field | Type   | Required | Description         |
| ----- | ------ | -------- | ------------------- |
| `id`  | number | Yes      | Folder ID to update |

### Request Body

| Field  | Type   | Required | Description                      |
| ------ | ------ | -------- | -------------------------------- |
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
- **Cache invalidation**: Updates cached folder data
- **Preserves images**: Only folder name changes, images remain unchanged
- **Maintains relationships**: All image associations preserved

### Example

```bash
curl -X PUT http://localhost:4444/api/image-folders/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Product Photos"}'
```

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
  "message": "Deleted successfully"
}
```

### Notes

- **Ownership validation**: Only folder owner can delete
- **Cascading delete**: Removes all images in the folder
- **Complete cleanup**: Deletes both database records AND Azure Blob Storage files
- **Cloud storage cleanup**: Removes all image files from Azure Blob Storage
- **Transaction safety**: Database operations are atomic
- **Cache invalidation**: Removes all cached folder data
- **Permanent action**: Cannot be undone
- **Graceful failure**: Continues even if some cloud deletions fail
- **Detailed logging**: Tracks deletion progress and failures

### Cloud Storage Cleanup Process

1. **Fetch folder with images**: Retrieves all images for URL extraction
2. **Azure deletion loop**: Deletes each image file from cloud storage
3. **Path construction**: Uses `images/user-{userId}/folder-{folderId}/{filename}`
4. **Error handling**: Logs failures but continues with database cleanup
5. **Database cleanup**: Removes all records in a transaction

### Example

```bash
curl -X DELETE http://localhost:4444/api/image-folders/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Cache Strategy

### Cache Keys

- **Individual Folder**: `user:{userId}:folder:{folderId}:full`
- **User Folders Summary**: `user:{userId}:folders:summary`

### Cache Operations

| Operation      | Cache Updates                                           |
| -------------- | ------------------------------------------------------- |
| Create Folder  | Creates full cache entry for new folder                |
| Get Folders    | Reads from summary cache, falls back to DB             |
| Get Folder     | Reads from full cache, falls back to DB and caches     |
| Update Folder  | Updates full cache entry with new name                 |
| Delete Folder  | Deletes all folder cache entries                       |

### Cache TTL

- **Folder Data**: No expiration (TTL: 0) - manual invalidation only
- **Summary Data**: No expiration (TTL: 0) - updated on folder changes

---

## Auto-Generation Rules

### Folder Organization

- **User isolation**: Each user's folders are completely separate
- **Unique names**: Folder names must be unique per user (case-sensitive)
- **Single-level**: No nested folder structure supported
- **Name preservation**: Original folder names maintained exactly as provided

### Database Constraints

- **Composite Unique Index**: `userId_name` prevents duplicate names per user
- **Foreign Key**: Folders linked to users via `userId`
- **Cascade Rules**: Deleting user would cascade to folders (if implemented)

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error message here"
}
```

### Common Errors

- **400** - Invalid input, validation errors, malformed request
- **401** - Authentication required or invalid token
- **403** - Insufficient permissions, not resource owner
- **404** - Folder not found or inaccessible
- **409** - Conflict (duplicate folder name)
- **500** - Server error, database issues

### Specific Error Messages

#### Validation Errors
- "Folder name cannot be empty" - Empty name after trimming
- "Folder name must be less than 100 characters" - Name exceeds limit
- "Folder name must be a string" - Invalid data type provided

#### Business Logic Errors
- "A folder with this name already exists" - Duplicate name for user
- "Folder not found or you don't have access" - Invalid ID or ownership
- "User not found" - Invalid user authentication

#### System Errors
- "User ID is required" - Missing authentication context
- "Cache update failed but folder was created" - Cache warning (non-fatal)

---

## Security Features

### Access Control

- **User isolation**: Users can only access their own folders
- **Ownership validation**: All operations verify folder ownership
- **Authentication required**: No public access to any endpoints
- **Session-based**: Uses JWT token authentication

### Data Validation

- **Input sanitization**: Names are trimmed and validated
- **Length limits**: 100 character maximum for folder names
- **Type checking**: Zod schema validation for all inputs
- **SQL injection protection**: Prisma ORM parameterized queries

### Audit Trail

- **Creation tracking**: `createdAt` timestamp for all folders
- **Modification tracking**: `updatedAt` timestamp for changes
- **User association**: `userId` links folders to owners
- **Operation logging**: Console logs for important operations

---

## Usage Patterns

### Creating Organized Structure

```bash
# Create category folders
curl -X POST http://localhost:4444/api/image-folders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Product Photos"}'

curl -X POST http://localhost:4444/api/image-folders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Hero Images"}'

curl -X POST http://localhost:4444/api/image-folders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Background Images"}'
```

### Folder Management Workflow

```bash
# Get all folders
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4444/api/image-folders

# Get specific folder with images
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4444/api/image-folders/1

# Rename folder
curl -X PUT http://localhost:4444/api/image-folders/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Updated Product Photos"}'

# Clean up unused folder
curl -X DELETE http://localhost:4444/api/image-folders/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Integration with Image Management

### Related Endpoints

- **Upload Images**: `POST /api/images/folder/:folderId`
- **Move Images**: `PUT /api/images/:imageId/move`
- **Delete Images**: `DELETE /api/images/:imageId`
- **Bulk Delete**: `DELETE /api/images/bulk`

### Folder-Image Relationships

- **One-to-Many**: Each folder can contain multiple images
- **Required Association**: Images must belong to a folder
- **Ownership Inheritance**: Image access controlled by folder ownership
- **Cascade Delete**: Deleting folder removes all contained images

### Cache Coordination

- **Image Operations**: Update folder cache when images change
- **Folder Operations**: Maintain image metadata in cache
- **Count Accuracy**: Dynamic image counts always current
- **Consistency**: Cache invalidation prevents stale data

---

## Performance Considerations

### Caching Strategy

- **Frequent Access**: Folder lists cached for quick retrieval
- **Large Folders**: Individual folder cache includes all images
- **Cache Warming**: Popular folders stay cached longer
- **Memory Efficiency**: TTL management prevents cache bloat

### Database Optimization

- **Indexed Queries**: `userId_name` composite index for uniqueness
- **Selective Loading**: Only load images when specifically requested
- **Transaction Efficiency**: Minimal transaction scope for consistency
- **Connection Pooling**: Prisma manages database connections

### Cloud Storage

- **Parallel Deletion**: Multiple Azure deletions can run concurrently
- **Error Resilience**: Database cleanup proceeds despite cloud failures
- **Path Optimization**: Consistent folder structure in cloud storage
- **Bandwidth Management**: Large folder deletions handled efficiently