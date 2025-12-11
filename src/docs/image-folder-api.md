# Image Folder API Documentation

## Overview

Image folder management system for the funnel builder platform. Handles the creation, retrieval, updating, and deletion of image folders that organize users' images. Features comprehensive caching with Redis, user-based permissions, and Azure Blob Storage integration for file cleanup.

All routes require `authenticateToken` middleware for user authentication and workspace-based permissions.

---

## Image Folder Management Routes

### 1. Create Image Folder

**Route:** `POST /api/image-folders/`  
**Authentication:** Required

Creates a new image folder with a unique name for the authenticated user.

### Request Body

| Field  | Type   | Required | Description                    |
| ------ | ------ | -------- | ------------------------------ |
| `name` | string | Yes      | Folder name (1-100 characters, trimmed) |

### Response

```json
{
  "message": "Image folder created successfully",
  "folderId": 123
}
```

### Validation Rules

- **Name**: Required, 1-100 characters, automatically trimmed
- **Uniqueness**: Folder name must be unique per user
- **User Permission**: User must exist and be authenticated

### Error Examples

```json
// Duplicate folder name
{
  "error": "A folder with this name already exists",
  "statusCode": 400
}

// Invalid name length
{
  "error": "Folder name cannot be empty",
  "statusCode": 400
}

// Name too long
{
  "error": "Folder name must be less than 100 characters",
  "statusCode": 400
}
```

---

### 2. Get All User Folders

**Route:** `GET /api/image-folders/`  
**Authentication:** Required

Retrieves all image folders belonging to the authenticated user with image counts.

### Response

```json
{
  "folders": [
    {
      "id": 123,
      "name": "Product Images",
      "userId": 456,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "imageCount": 5
    },
    {
      "id": 124,
      "name": "Hero Banners",
      "userId": 456,
      "createdAt": "2024-01-14T15:20:00.000Z",
      "updatedAt": "2024-01-14T15:20:00.000Z",
      "imageCount": 3
    }
  ]
}
```

### Caching

- **Cache Key:** `user:{userId}:folders:summary`
- **TTL:** Persistent (0)
- **Update Strategy:** Invalidated on folder create/update/delete operations

### Error Examples

```json
// User not found
{
  "error": "User not found",
  "statusCode": 404
}
```

---

### 3. Get Folder by ID

**Route:** `GET /api/image-folders/:id`  
**Authentication:** Required

Retrieves a specific folder with all its images. Only accessible by the folder owner.

### Path Parameters

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `id`      | string | Yes      | Folder ID (positive integer)  |

### Response

```json
{
  "id": 123,
  "name": "Product Images",
  "userId": 456,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "images": [
    {
      "id": 789,
      "name": "product-1.jpg",
      "url": "https://storage.azure.com/images/product-1.jpg",
      "createdAt": "2024-01-15T11:00:00.000Z"
    },
    {
      "id": 790,
      "name": "product-2.png",
      "url": "https://storage.azure.com/images/product-2.png",
      "createdAt": "2024-01-15T11:15:00.000Z"
    }
  ]
}
```

### Caching

- **Cache Key:** `user:{userId}:folder:{folderId}:full`
- **TTL:** Persistent (0)
- **Content:** Complete folder data with images ordered by creation date (desc)

### Error Examples

```json
// Folder not found or unauthorized
{
  "error": "Folder not found or you don't have access",
  "statusCode": 404
}

// Invalid ID format
{
  "error": "Folder ID must be a valid positive number",
  "statusCode": 400
}
```

---

### 4. Update Image Folder

**Route:** `PUT /api/image-folders/:id`  
**Authentication:** Required

Updates the name of an existing image folder. Only accessible by the folder owner.

### Path Parameters

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `id`      | string | Yes      | Folder ID (positive integer)  |

### Request Body

| Field  | Type   | Required | Description                    |
| ------ | ------ | -------- | ------------------------------ |
| `name` | string | Yes      | New folder name (1-100 characters, trimmed) |

### Response

```json
{
  "message": "Updated successfully"
}
```

### Validation Rules

- **Name**: Required, 1-100 characters, automatically trimmed
- **Uniqueness**: New name must be unique among user's other folders
- **Ownership**: User must own the folder being updated

### Error Examples

```json
// Folder not found
{
  "error": "Folder not found or you don't have access",
  "statusCode": 404
}

// Duplicate name
{
  "error": "A folder with this name already exists",
  "statusCode": 400
}

// Invalid name
{
  "error": "Folder name cannot be empty",
  "statusCode": 400
}
```

---

### 5. Delete Image Folder

**Route:** `DELETE /api/image-folders/:id`  
**Authentication:** Required

Deletes an image folder and all its contained images. Includes Azure Blob Storage cleanup.

### Path Parameters

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `id`      | string | Yes      | Folder ID (positive integer)  |

### Response

```json
{
  "message": "Deleted successfully"
}
```

### Deletion Process

1. **Validation**: Verify folder exists and user has permission
2. **Azure Cleanup**: Delete all images from Azure Blob Storage
3. **Database Transaction**: Remove images and folder from database
4. **Cache Update**: Clear folder cache and refresh user summary

### Error Examples

```json
// Folder not found
{
  "error": "Folder not found or you don't have access",
  "statusCode": 404
}

// Invalid ID format
{
  "error": "Folder ID must be a valid positive number",
  "statusCode": 400
}
```

---

## Data Models

### Folder Object (Summary)

```typescript
interface FolderSummary {
  id: number;
  name: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  imageCount: number;
}
```

### Folder Object (Full)

```typescript
interface FolderFull {
  id: number;
  name: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  images: Image[];
}

interface Image {
  id: number;
  name: string;
  url: string;
  createdAt: Date;
}
```

---

## Technical Implementation

### Database Schema

```sql
-- Image folders table
CREATE TABLE image_folder (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name) -- Ensures unique names per user
);

-- Images table (related)
CREATE TABLE image (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  size INTEGER,
  folder_id INTEGER NOT NULL REFERENCES image_folder(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Caching Strategy

- **Provider:** Redis
- **Cache Types:** 
  - Summary cache: `user:{userId}:folders:summary`
  - Full folder cache: `user:{userId}:folder:{folderId}:full`
- **TTL:** Persistent (0) - manually invalidated
- **Update Pattern:** Write-through with automatic invalidation

### Azure Integration

- **Storage Path:** `images/user-{userId}/folder-{folderId}/`
- **Cleanup Strategy:** Bulk deletion on folder removal
- **Error Handling:** Continue with database operations even if Azure cleanup fails
- **Logging:** Detailed logs for Azure operations and failures

### Security Features

- **Authentication:** JWT token required for all endpoints
- **Authorization:** User can only access their own folders
- **Validation:** Zod schemas for all request/response data
- **SQL Injection:** Prisma ORM prevents SQL injection
- **Transaction Safety:** Database operations wrapped in transactions

---

## Integration Examples

### JavaScript/TypeScript

```javascript
// Create folder
const createResponse = await fetch('/api/image-folders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'My New Folder'
  })
});

// Get all folders
const foldersResponse = await fetch('/api/image-folders', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get specific folder
const folderResponse = await fetch('/api/image-folders/123', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Update folder
const updateResponse = await fetch('/api/image-folders/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Updated Folder Name'
  })
});

// Delete folder
const deleteResponse = await fetch('/api/image-folders/123', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### cURL Examples

```bash
# Create folder
curl -X POST "https://api.example.com/api/image-folders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{"name": "My New Folder"}'

# Get all folders
curl -X GET "https://api.example.com/api/image-folders" \
  -H "Authorization: Bearer your_token"

# Get specific folder
curl -X GET "https://api.example.com/api/image-folders/123" \
  -H "Authorization: Bearer your_token"

# Update folder
curl -X PUT "https://api.example.com/api/image-folders/123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{"name": "Updated Folder Name"}'

# Delete folder
curl -X DELETE "https://api.example.com/api/image-folders/123" \
  -H "Authorization: Bearer your_token"
```

---

## Performance Considerations

### Caching Benefits

- **Reduced Database Queries**: Frequently accessed folder data served from cache
- **Faster Response Times**: Redis cache provides sub-millisecond access
- **Automatic Invalidation**: Cache updated on all modification operations

### Optimization Strategies

- **Image Ordering**: Images sorted by creation date (desc) for consistent pagination
- **Selective Loading**: Summary view excludes image details for faster folder lists
- **Transaction Usage**: Bulk operations wrapped in database transactions
- **Error Resilience**: Azure failures don't block database operations

### Scalability Features

- **User Isolation**: All operations scoped to authenticated user
- **Efficient Queries**: Database indexes on user_id and folder relationships
- **Background Cleanup**: Azure deletion operations logged but don't block responses
- **Cache Partitioning**: Separate cache keys per user prevent cache collisions