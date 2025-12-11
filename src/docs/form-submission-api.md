# Form Submission API Documentation

## Overview

Form submission management system for the funnel builder platform. Handles the creation and retrieval of form submissions within funnel sessions. This system supports both partial and complete form submissions, with automatic webhook triggering and session interaction tracking.

**Authentication:** Mixed - Create endpoint is public, retrieval requires authentication.

---

## Form Submission Routes

### 1. Create Form Submission

**Route:** `POST /api/form-submissions/`  
**Authentication:** Not Required (Public Endpoint)

Creates or updates a form submission within a session. This endpoint supports both partial submissions (progressive form filling) and complete submissions. Automatically triggers webhooks when submissions are marked as complete.

### Request Body

| Field           | Type   | Required | Description                    |
| --------------- | ------ | -------- | ------------------------------ |
| `formId`        | number | Yes      | Form ID (positive integer)     |
| `sessionId`     | string | Yes      | Session ID (non-empty string)  |
| `submittedData` | object | No       | Form data (key-value pairs)    |
| `isCompleted`   | boolean| No       | Completion status (default: true) |

### Response

```json
{
  "message": "Form submission created successfully",
  "submissionId": 123
}
```

### Business Logic

#### Create vs Update Behavior
- **New Submission**: Creates new record if no existing submission for form+session combination
- **Update Existing**: Updates existing submission if form+session combination already exists
- **Completion Tracking**: Sets `completedAt` timestamp when `isCompleted: true`

#### Session Integration
- **Interaction Tracking**: Records submission in session interactions for analytics
- **Progressive Updates**: Updates existing interaction for same form within session
- **Session Validation**: Verifies session exists and hasn't expired

#### Webhook Integration
- **Automatic Triggers**: Fires webhook only when `isCompleted: true`
- **Payload Structure**: Includes form data, metadata, and submission details
- **Error Handling**: Webhook failures logged but don't affect submission success

### Validation Rules

- **Form Validation**: Form must exist and be active (`isActive: true`)
- **Session Validation**: Session must exist in database (not expired)
- **Data Structure**: `submittedData` must be valid JSON object or null
- **ID Validation**: `formId` must be positive integer

### Error Examples

```json
// Form not found
{
  "message": "Form not found",
  "statusCode": 404
}

// Form inactive
{
  "message": "Form is not active",
  "statusCode": 400
}

// Session not found
{
  "message": "Session not found or may have expired",
  "statusCode": 404
}

// Invalid form ID
{
  "message": "Form ID must be a positive number",
  "statusCode": 400
}
```

### Webhook Payload

When `isCompleted: true`, the following payload is sent to configured webhooks:

```json
{
  "formId": 123,
  "submissionId": 456,
  "formName": "Contact Form",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello world!"
  },
  "submittedAt": "2024-01-01T12:00:00.000Z",
  "metadata": {
    "sessionId": "sess_123456789",
    "userAgent": undefined,
    "ipAddress": undefined
  }
}
```

---

### 2. Get All Form Submissions

**Route:** `GET /api/form-submissions/:funnelId`  
**Authentication:** Required  
**Permission:** `VIEW_ANALYTICS` or workspace owner/admin

Retrieves paginated form submissions for a specific funnel with advanced filtering, sorting, and search capabilities.

### URL Parameters

| Parameter  | Type   | Required | Description                    |
| ---------- | ------ | -------- | ------------------------------ |
| `funnelId` | number | Yes      | Funnel ID (positive integer)   |

### Query Parameters

| Parameter      | Type    | Required | Description                    |
| -------------- | ------- | -------- | ------------------------------ |
| `formId`       | number  | No       | Filter by specific form ID     |
| `sessionId`    | string  | No       | Filter by specific session ID  |
| `dateFrom`     | number  | No       | Start date (Unix timestamp)    |
| `dateTo`       | number  | No       | End date (Unix timestamp)      |
| `completedOnly`| boolean | No       | Filter completed submissions only |
| `sortBy`       | string  | No       | Sort field: `createdAt` or `updatedAt` (default: `createdAt`) |
| `sortOrder`    | string  | No       | Sort order: `asc` or `desc` (default: `desc`) |
| `page`         | number  | No       | Page number (default: 1)       |
| `limit`        | number  | No       | Items per page (1-100, default: 10) |

### Response

```json
{
  "submissions": [
    {
      "id": 123,
      "formId": 45,
      "formName": "Contact Form",
      "sessionId": "sess_123456789",
      "submittedData": {
        "name": "John Doe",
        "email": "john@example.com",
        "message": "Hello world!"
      },
      "isCompleted": true,
      "completedAt": "2024-01-01T12:00:00.000Z",
      "createdAt": "2024-01-01T11:55:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "funnelName": "Lead Generation Funnel",
  "pagination": {
    "total": 150,
    "totalPages": 15,
    "currentPage": 1,
    "limit": 10
  },
  "filters": {
    "formId": null,
    "sessionId": null,
    "dateFrom": null,
    "dateTo": null,
    "completedOnly": null,
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

### Filtering & Pagination

#### Advanced Filtering
- **Form-Specific**: Filter by specific form within the funnel
- **Session-Specific**: Filter by specific user session
- **Date Range**: Filter by creation date range using Unix timestamps
- **Completion Status**: Show only completed or incomplete submissions
- **Combined Filters**: All filters can be used together

#### Intelligent Pagination
- **Configurable Limits**: 1-100 items per page (default: 10)
- **Total Count**: Provides total submissions matching filters
- **Page Calculation**: Automatic page count calculation
- **Performance Optimized**: Uses database skip/take for efficient pagination

#### Flexible Sorting
- **Sort Fields**: `createdAt` (default) or `updatedAt`
- **Sort Orders**: `asc` or `desc` (default: `desc`)
- **Consistent Results**: Stable sorting across paginated requests

### Permission System

#### Workspace-Based Access
- **Owner Access**: Workspace owners can view all funnel submissions
- **Admin Access**: Workspace admins can view all funnel submissions  
- **Member Access**: Requires `VIEW_ANALYTICS` permission
- **Viewer Access**: Requires `VIEW_ANALYTICS` permission

#### Permission Validation Flow
1. Verify user authentication
2. Check funnel exists and belongs to workspace
3. Validate workspace ownership OR membership with `VIEW_ANALYTICS`
4. Return forbidden error if insufficient permissions

### Error Examples

```json
// Funnel not found
{
  "message": "Funnel not found",
  "statusCode": 404
}

// No workspace access
{
  "message": "You do not have access to this workspace", 
  "statusCode": 403
}

// Insufficient permissions
{
  "message": "You do not have permission to view form submissions for this funnel",
  "statusCode": 403
}

// Invalid funnel ID
{
  "message": "Funnel ID must be a positive number",
  "statusCode": 400
}

// Invalid pagination
{
  "message": "Invalid data provided",
  "statusCode": 400
}
```

---

## Authentication & Security

### Mixed Authentication Model

- **Public Submission**: Creation endpoint requires no authentication for user-facing forms
- **Private Analytics**: Retrieval endpoint requires full authentication and permissions
- **Session Validation**: All operations validate session existence and integrity

### Permission Requirements

#### Create Submission (No Auth)
- Form must exist and be active
- Session must be valid (not expired)
- No user authentication required

#### View Submissions (Auth Required)
- User must be authenticated
- Must have workspace access (owner, admin, or member)
- Must have `VIEW_ANALYTICS` permission (unless owner/admin)

### Data Privacy & Security

- **Session Isolation**: Users can only access their own session data through public endpoints
- **Workspace Isolation**: Authenticated users can only access workspace data they have permission for
- **Form Validation**: All form data validated against form schema before storage
- **SQL Injection Protection**: All database queries use parameterized statements

---

## Business Logic

### Submission Lifecycle

1. **Validation Phase**
   - Validate form exists and is active
   - Verify session exists and is valid
   - Check data structure and types

2. **Storage Phase**
   - Create new submission or update existing
   - Update session interaction history
   - Set completion timestamps

3. **Integration Phase**
   - Trigger webhooks for completed submissions
   - Update analytics data
   - Log interaction events

### Session Integration

#### Progressive Form Filling
- **Multiple Updates**: Same form can be updated multiple times per session
- **Interaction History**: Each update recorded in session interactions
- **Completion Tracking**: Only final submission triggers webhooks

#### Analytics Integration
- **Conversion Tracking**: Track form completion rates
- **Session Flow**: Monitor user journey through forms
- **Funnel Analytics**: Aggregate submission data for funnel performance

### Webhook System

#### Trigger Conditions
- Only fires when `isCompleted: true`
- Includes complete form data and metadata
- Handles webhook failures gracefully

#### Security Features
- HTTPS-only webhook URLs
- HMAC signature verification (if secret configured)
- Custom headers support for authentication

---

## Usage Examples

### Creating a Form Submission (Public)

```bash
# Initial submission (partial)
curl -X POST http://localhost:4444/api/form-submissions/ \
  -H "Content-Type: application/json" \
  -d '{
    "formId": 123,
    "sessionId": "sess_user_123456",
    "submittedData": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "isCompleted": false
  }'

# Complete submission (triggers webhook)  
curl -X POST http://localhost:4444/api/form-submissions/ \
  -H "Content-Type: application/json" \
  -d '{
    "formId": 123,
    "sessionId": "sess_user_123456", 
    "submittedData": {
      "name": "John Doe",
      "email": "john@example.com",
      "message": "I am interested in your services"
    },
    "isCompleted": true
  }'
```

### Retrieving Form Submissions (Authenticated)

```bash
# Get all submissions for funnel
curl -X GET http://localhost:4444/api/form-submissions/456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by specific form and date range
curl -X GET "http://localhost:4444/api/form-submissions/456?formId=123&dateFrom=1704067200&dateTo=1704153600&completedOnly=true&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by session and sort by update date
curl -X GET "http://localhost:4444/api/form-submissions/456?sessionId=sess_user_123456&sortBy=updatedAt&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Advanced Filtering Examples

```bash
# Get incomplete submissions from last 7 days
curl -X GET "http://localhost:4444/api/form-submissions/456?completedOnly=false&dateFrom=1703980800&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get all submissions for specific form, paginated
curl -X GET "http://localhost:4444/api/form-submissions/456?formId=123&page=2&limit=25&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Integration Points

### Session Management
- **Session Creation**: Sessions must be created before form submissions
- **Session Tracking**: All interactions recorded in session history
- **Session Expiry**: Invalid sessions prevent submission creation

### Webhook System  
- **Form Configuration**: Webhooks configured at form level
- **Delivery Tracking**: Success/failure counts maintained
- **Retry Logic**: Failed webhooks logged but don't block submissions

### Analytics Integration
- **Funnel Metrics**: Submission data feeds funnel conversion analytics
- **Form Performance**: Track completion rates by form
- **User Journey**: Session-based flow analysis

---

## Related APIs

- **Form Management**: `/api/forms/*` - For creating and managing forms
- **Session Management**: Session endpoints for user tracking
- **Funnel Analytics**: Analytics endpoints for submission metrics
- **Webhook Configuration**: Form webhook setup and management