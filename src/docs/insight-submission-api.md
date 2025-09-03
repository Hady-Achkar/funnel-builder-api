# Insight Submission API

The Insight Submission API manages the collection and retrieval of user responses to insights (surveys, polls, quizzes, forms) within funnels. This API allows for anonymous submission of insight data and authenticated retrieval for analysis.

## Base URL
```
/api/insight-submissions
```

## Authentication
- **POST** endpoints: Public (no authentication required)
- **GET** endpoints: Requires JWT authentication via Authorization header or cookies

## Endpoints

### 1. Create Insight Submission
Creates a new submission for an insight, recording user responses.

**Endpoint:** `POST /api/insight-submissions/`

**Authentication:** None required (Public endpoint)

**Request Body:**
```json
{
  "insightId": 1,
  "sessionId": "session-uuid-123",
  "answers": {
    "question1": "answer1",
    "question2": ["option1", "option2"],
    "rating": 5
  }
}
```

**Request Schema:**
- `insightId` (number, required): ID of the insight being submitted
- `sessionId` (string, required): Unique session identifier for tracking user journey
- `answers` (object, required): User responses to insight questions/options

**Response:**
```json
{
  "id": 123,
  "insightId": 1,
  "sessionId": "session-uuid-123",
  "answers": {
    "question1": "answer1",
    "question2": ["option1", "option2"],
    "rating": 5
  },
  "completedAt": "2023-12-01T10:30:00.000Z",
  "createdAt": "2023-12-01T10:30:00.000Z",
  "updatedAt": "2023-12-01T10:30:00.000Z"
}
```

**Status Codes:**
- `201`: Submission created successfully
- `400`: Invalid request data or validation errors
- `404`: Insight not found
- `500`: Internal server error

---

### 2. Get All Insight Submissions
Retrieves all insight submissions for a specific funnel with filtering, sorting, and pagination.

**Endpoint:** `GET /api/insight-submissions/:funnelId`

**Authentication:** Required (JWT token)

**Path Parameters:**
- `funnelId` (number): ID of the funnel to retrieve submissions for

**Query Parameters:**
```
?type=SURVEY&insightId=123&sessionId=session-123&dateFrom=2023-01-01&dateTo=2023-12-31&completedOnly=true&sortBy=createdAt&sortOrder=desc&page=1&limit=20
```

**Query Schema:**
- `type` (string, optional): Filter by insight type (SURVEY, POLL, QUIZ, FORM)
- `insightId` (number, optional): Filter by specific insight ID
- `sessionId` (string, optional): Filter by specific session ID
- `dateFrom` (string, optional): Filter submissions from date (ISO format)
- `dateTo` (string, optional): Filter submissions to date (ISO format)
- `completedOnly` (boolean, optional): Filter only completed submissions
- `sortBy` (string, optional): Sort field (createdAt, updatedAt, completedAt)
- `sortOrder` (string, optional): Sort order (asc, desc)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)

**Response:**
```json
{
  "submissions": [
    {
      "id": 123,
      "insightId": 1,
      "insightName": "Customer Satisfaction Survey",
      "insightType": "SURVEY",
      "sessionId": "session-uuid-123",
      "answers": {
        "satisfaction": 5,
        "feedback": "Great service!"
      },
      "completedAt": "2023-12-01T10:30:00.000Z",
      "createdAt": "2023-12-01T10:30:00.000Z",
      "updatedAt": "2023-12-01T10:30:00.000Z"
    }
  ],
  "funnelName": "Product Launch Funnel",
  "pagination": {
    "total": 150,
    "totalPages": 8,
    "currentPage": 1,
    "limit": 20
  },
  "filters": {
    "type": "SURVEY",
    "insightId": null,
    "sessionId": null,
    "dateFrom": null,
    "dateTo": null,
    "completedOnly": true,
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

**Status Codes:**
- `200`: Submissions retrieved successfully
- `400`: Invalid request parameters or validation errors
- `401`: Unauthorized (invalid or missing JWT token)
- `403`: Forbidden (insufficient permissions to view funnel submissions)
- `404`: Funnel not found or user doesn't have access
- `500`: Internal server error

## Permissions

### Workspace-Based Access Control
Access to insight submissions is controlled through workspace membership:

**Workspace Owner:** Full access to all submissions in their workspace funnels

**Workspace Members:** Access based on role and permissions:
- **ADMIN:** Full access to all submissions
- **EDITOR/VIEWER:** Requires `VIEW_ANALYTICS` permission

### Permission Validation
The API validates workspace access through:
1. Funnel ownership verification
2. Workspace membership verification
3. Role and permission checks for non-owners

## Data Models

### Insight Submission
```typescript
{
  id: number;
  insightId: number;
  sessionId: string;
  answers: Record<string, any>;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Related Models
- **Insight:** Contains the questions/configuration for data collection
- **Session:** Tracks user journey across funnel pages
- **Funnel:** Contains insights and belongs to a workspace

## Error Handling

### Common Error Responses
```json
{
  "error": "Error message",
  "errors": [
    {
      "field": "insightId",
      "message": "Insight ID is required"
    }
  ]
}
```

### Validation Errors
All requests are validated using Zod schemas. Validation errors return detailed field-specific messages.

## Usage Examples

### Create Submission (JavaScript)
```javascript
const response = await fetch('/api/insight-submissions/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    insightId: 1,
    sessionId: 'user-session-123',
    answers: {
      'rating': 5,
      'feedback': 'Excellent product!'
    }
  })
});

const submission = await response.json();
```

### Get Submissions with Filters (JavaScript)
```javascript
const response = await fetch('/api/insight-submissions/1?type=SURVEY&completedOnly=true&page=1&limit=20', {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});

const data = await response.json();
const { submissions, pagination } = data;
```

## Session Management

### Session Creation
When creating submissions, if the provided `sessionId` doesn't exist, a new session is automatically created using the insight's funnel ID. This ensures data consistency and proper foreign key relationships.

### Session Tracking
Sessions track user interactions across funnel pages and provide context for insight submissions, enabling journey analysis and funnel optimization.