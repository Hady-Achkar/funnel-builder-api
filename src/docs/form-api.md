# Form API Documentation

## Overview

Form management system for the funnel builder platform. Handles form creation, updates, deletion, and webhook configuration for form submissions. Forms can be associated with funnels and support custom webhook integrations for real-time submission processing.

All routes require `authenticateToken` middleware for user authentication.

---

## Form Management Routes

### 1. Create Form

**Route:** `POST /api/forms/`  
**Authentication:** Required

Creates a new form with specified configuration. Forms can be standalone or associated with a funnel for integration into funnel flows.

### Request Body

| Field         | Type   | Required | Description                    |
| ------------- | ------ | -------- | ------------------------------ |
| `name`        | string | Yes      | Form name (1-255 characters) |
| `description` | string | No       | Form description (max 1000 characters) |
| `formContent` | object | Yes      | Form structure and field definitions |
| `isActive`    | boolean| No       | Form active status (default: true) |
| `funnelId`    | number | No       | Associated funnel ID (positive integer) |

### Response

```json
{
  "message": "Form created successfully",
  "formId": 123
}
```

### Validation Rules

- **Name**: Required, 1-255 characters, trimmed
- **Description**: Optional, max 1000 characters, nullable
- **Form Content**: Required, must be a valid object containing form structure
- **Funnel ID**: Optional, must be positive integer, user must own the funnel
- **User Permission**: User must exist and have access to associated funnel (if specified)

### Error Examples

```json
// Invalid form name
{
  "message": "Form name cannot be empty",
  "statusCode": 400
}

// Funnel not found or no access
{
  "message": "Funnel not found",
  "statusCode": 404
}

// Permission denied
{
  "message": "You can only create forms for your own funnels",
  "statusCode": 403
}
```

---

### 2. Update Form

**Route:** `PUT /api/forms/:id`  
**Authentication:** Required

Updates an existing form. Supports partial updates and webhook configuration. Users can only update forms for funnels they own, with special permissions for webhook configuration.

### URL Parameters

| Parameter | Type   | Required | Description           |
| --------- | ------ | -------- | --------------------- |
| `id`      | number | Yes      | Form ID to update     |

### Request Body

| Field           | Type   | Required | Description                    |
| --------------- | ------ | -------- | ------------------------------ |
| `name`          | string | No       | Updated form name (1-255 characters) |
| `description`   | string | No       | Updated description (max 1000 characters) |
| `formContent`   | object | No       | Updated form structure |
| `isActive`      | boolean| No       | Updated active status |
| `webhookUrl`    | string | No       | HTTPS webhook URL for submissions |
| `webhookEnabled`| boolean| No       | Enable/disable webhook |
| `webhookHeaders`| object | No       | Custom headers for webhook requests |
| `webhookSecret` | string | No       | Secret for webhook signature verification |

### Response

```json
{
  "message": "Form updated successfully"
}
```

### Webhook Configuration

- **URL Validation**: Must be HTTPS for security
- **Permission Requirements**: User must have `EDIT_FUNNELS` permission or be workspace owner/admin
- **Headers**: Custom key-value pairs sent with webhook requests
- **Secret**: Used for HMAC signature generation for request verification

### Permission Hierarchy

1. **Form Owner**: Can update all fields including basic form properties
2. **Workspace Owner/Admin**: Can configure webhooks for any form in workspace
3. **Members with EDIT_FUNNELS**: Can configure webhooks for forms in workspace
4. **Other Members**: Cannot update forms they don't own

### Error Examples

```json
// Form not found
{
  "message": "Form not found",
  "statusCode": 404
}

// No permission for webhook configuration
{
  "message": "You don't have permission to configure webhooks for this form",
  "statusCode": 403
}

// Invalid webhook URL
{
  "message": "Webhook URL must use HTTPS for security",
  "statusCode": 400
}

// No fields to update
{
  "message": "No fields to update",
  "statusCode": 400
}
```

---

### 3. Delete Form

**Route:** `DELETE /api/forms/:id`  
**Authentication:** Required

Permanently deletes a form and all associated submissions. Only form owners can delete forms. This action is irreversible.

### URL Parameters

| Parameter | Type   | Required | Description           |
| --------- | ------ | -------- | --------------------- |
| `id`      | number | Yes      | Form ID to delete     |

### Response

```json
{
  "message": "The form has been deleted successfully"
}
```

### Deletion Behavior

- **Cascade Delete**: All form submissions are automatically deleted
- **Permission Check**: Only funnel owners can delete associated forms
- **Irreversible**: Deleted forms cannot be recovered
- **Webhook Cleanup**: Webhook configurations are removed

### Error Examples

```json
// Form not found
{
  "message": "Form not found",
  "statusCode": 404
}

// Permission denied
{
  "message": "You can only delete forms for your own funnels",
  "statusCode": 403
}

// Invalid form ID
{
  "message": "Invalid form ID",
  "statusCode": 400
}
```

---

### 4. Configure Webhook

**Route:** `PUT /api/forms/webhook/:formId/configure`  
**Authentication:** Required  
**Permission:** `EDIT_FUNNELS` or workspace owner/admin

Configures webhook settings for form submissions. Webhooks enable real-time notifications when forms are submitted, with support for custom headers and signature verification.

### URL Parameters

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `formId`  | number | Yes      | Form ID to configure webhook   |

### Request Body

| Field           | Type   | Required | Description                    |
| --------------- | ------ | -------- | ------------------------------ |
| `webhookUrl`    | string | Yes      | HTTPS URL for webhook delivery |
| `webhookEnabled`| boolean| No       | Enable webhook (default: true) |
| `webhookHeaders`| object | No       | Custom headers (key-value pairs) |
| `webhookSecret` | string | No       | Secret for HMAC signature |

### Response

```json
{
  "message": "Webhook configuration updated successfully",
  "success": true
}
```

### Webhook Payload Structure

When a form is submitted, the webhook receives this payload:

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
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.1"
  }
}
```

### Webhook Security

- **HTTPS Required**: All webhook URLs must use HTTPS
- **Signature Verification**: Optional HMAC-SHA256 signature in headers
- **Custom Headers**: Support for authentication tokens or API keys
- **Timeout**: 10-second timeout for webhook delivery
- **Retry Logic**: Failed webhooks increment failure count

### Signature Headers

When `webhookSecret` is provided:
- `X-Webhook-Signature`: `sha256={signature}`
- `X-Webhook-Signature-256`: `sha256={signature}`

### Error Examples

```json
// Form not associated with funnel
{
  "message": "Cannot configure webhook for forms not associated with a funnel",
  "statusCode": 400
}

// No permission
{
  "message": "You don't have permission to configure webhooks",
  "statusCode": 403
}

// Invalid webhook URL
{
  "message": "Webhook URL must use HTTPS for security",
  "statusCode": 400
}
```

---

## Authentication & Security

### Required Permissions

- **Form Creation**: User must exist and have funnel access (if `funnelId` provided)
- **Form Updates**: User must own the funnel or have webhook permissions
- **Form Deletion**: User must own the associated funnel
- **Webhook Configuration**: User must have `EDIT_FUNNELS` permission or be workspace owner/admin

### Workspace Validation

All operations validate:
- User authentication and existence
- Funnel ownership for form operations
- Workspace permissions for webhook configuration
- Form-funnel association requirements

### Rate Limiting

- Standard API rate limiting applies to all endpoints
- Form creation may be limited by subscription plan
- Webhook delivery has built-in timeout and retry logic

---

## Business Logic

### Form-Funnel Relationships

- **Optional Association**: Forms can exist without funnel association
- **Ownership Validation**: Users can only create forms for owned funnels
- **Permission Inheritance**: Form permissions follow funnel ownership rules

### Webhook System

- **Conditional Webhooks**: Only forms associated with funnels support webhooks
- **Automatic Triggers**: Webhooks fire automatically on form submission
- **Delivery Tracking**: Success/failure counts tracked per form
- **Security Headers**: Support for custom authentication and signatures

### Data Management

- **Cascade Operations**: Form deletion removes all submissions
- **Validation Pipeline**: Comprehensive input validation using Zod schemas
- **Transaction Safety**: Critical operations use database transactions

---

## Integration Examples

### Creating a Contact Form

```bash
curl -X POST http://localhost:4444/api/forms/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Contact Form",
    "description": "Main website contact form",
    "formContent": {
      "fields": [
        {
          "name": "name",
          "type": "text",
          "label": "Full Name",
          "required": true
        },
        {
          "name": "email", 
          "type": "email",
          "label": "Email Address",
          "required": true
        },
        {
          "name": "message",
          "type": "textarea", 
          "label": "Message",
          "required": true
        }
      ]
    },
    "isActive": true,
    "funnelId": 123
  }'
```

### Configuring Webhook with Authentication

```bash
curl -X PUT http://localhost:4444/api/forms/webhook/123/configure \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "webhookUrl": "https://api.example.com/webhooks/forms",
    "webhookEnabled": true,
    "webhookHeaders": {
      "Authorization": "Bearer webhook_token_123",
      "X-Custom-Source": "funnel-builder"
    },
    "webhookSecret": "your_webhook_secret_here"
  }'
```

### Updating Form Status

```bash
curl -X PUT http://localhost:4444/api/forms/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "isActive": false,
    "description": "Temporarily disabled for maintenance"
  }'
```

---

## Related APIs

- **Form Submissions**: `/api/form-submissions/*` - For managing form submission data
- **Funnel Management**: `/api/funnels/*` - For creating and managing funnels
- **Workspace Management**: `/api/workspaces/*` - For workspace permissions and access control