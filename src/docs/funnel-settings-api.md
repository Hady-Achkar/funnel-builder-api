# Funnel Settings API Documentation

## Overview

Funnel settings management routes for funnel builder. Includes both authenticated and public endpoints for managing funnel configurations, SEO settings, password protection, and tracking scripts.

---

## 1. Get Funnel Settings

**Route:** `GET /api/funnel-settings/:funnelId`  
**Authentication:** Not required (Public)

### URL Parameters

| Field      | Type   | Required | Description         |
| ---------- | ------ | -------- | ------------------- |
| `funnelId` | number | Yes      | Funnel ID to retrieve settings for |

### Response

```json
{
  "id": 123,
  "funnelId": 456,
  "defaultSeoTitle": "My Funnel",
  "defaultSeoDescription": "A great funnel for conversions",
  "defaultSeoKeywords": "sales, funnel, conversion",
  "favicon": "https://example.com/favicon.ico",
  "ogImage": "https://example.com/og-image.jpg",
  "googleAnalyticsId": "GA-123456789",
  "facebookPixelId": "123456789",
  "customTrackingScripts": ["<script>/* custom script */</script>"],
  "enableCookieConsent": true,
  "cookieConsentText": "We use cookies to improve your experience",
  "privacyPolicyUrl": "https://example.com/privacy",
  "termsOfServiceUrl": "https://example.com/terms",
  "language": "en",
  "timezone": "UTC",
  "dateFormat": "DD.MM.YYYY",
  "isPasswordProtected": false,
  "createdAt": "2025-08-23T10:00:00.000Z",
  "updatedAt": "2025-08-23T10:00:00.000Z"
}
```

### Notes

- **Public endpoint** - no authentication required
- **Cache-first approach**: Checks cache before database
- Returns all funnel settings including SEO and tracking configurations
- Password hash is never exposed in response

---

## 2. Update Funnel Settings

**Route:** `PUT /api/funnel-settings/:id`  
**Authentication:** Required

### URL Parameters

| Field | Type   | Required | Description                   |
| ----- | ------ | -------- | ----------------------------- |
| `id`  | number | Yes      | Funnel ID to update settings for |

### Request Body

| Field                 | Type    | Required | Description                               |
| --------------------- | ------- | -------- | ----------------------------------------- |
| `defaultSeoTitle`     | string  | No       | Default SEO title for funnel pages        |
| `defaultSeoDescription` | string | No      | Default SEO description for funnel pages  |
| `defaultSeoKeywords`  | string  | No       | Default SEO keywords for funnel pages     |
| `favicon`             | string  | No       | URL to favicon file                       |
| `ogImage`             | string  | No       | URL to Open Graph image                   |
| `googleAnalyticsId`   | string  | No       | Google Analytics tracking ID              |
| `facebookPixelId`     | string  | No       | Facebook Pixel tracking ID                |
| `customTrackingScripts` | array | No       | Array of custom tracking scripts         |
| `enableCookieConsent` | boolean | No       | Enable cookie consent banner              |
| `cookieConsentText`   | string  | No       | Text for cookie consent banner            |
| `privacyPolicyUrl`    | string  | No       | URL to privacy policy page                |
| `termsOfServiceUrl`   | string  | No       | URL to terms of service page              |
| `language`            | string  | No       | Language code (e.g., "en", "de")         |
| `timezone`            | string  | No       | Timezone identifier (e.g., "UTC", "EST") |
| `dateFormat`          | string  | No       | Date format string                        |

### Response

```json
{
  "message": "Funnel settings updated successfully",
  "success": true
}
```

### Notes

- **Partial updates supported**: Only send fields you want to change
- **URL validation**: Privacy policy and terms URLs must be valid URLs or null
- **Automatic cache update**: Updates cached settings after successful update
- Requires EDIT_FUNNELS permission or Owner/Admin role in workspace
- Settings are auto-created if they don't exist when funnel is created

---

## 3. Lock Funnel (Password Protection)

**Route:** `POST /api/funnel-settings/lock-funnel/:funnelId`  
**Authentication:** Required

### URL Parameters

| Field      | Type   | Required | Description         |
| ---------- | ------ | -------- | ------------------- |
| `funnelId` | number | Yes      | Funnel ID to lock   |

### Request Body

| Field      | Type   | Required | Description                    |
| ---------- | ------ | -------- | ------------------------------ |
| `password` | string | Yes      | Password to protect funnel (min 6, max 100 chars) |

### Response

```json
{
  "message": "Funnel locked successfully",
  "success": true
}
```

### Notes

- **Password security**: Password is hashed using bcryptjs with 10 salt rounds
- **Creates or updates**: Will create funnel settings if they don't exist
- **Atomic operation**: Uses database transaction for consistency
- Requires EDIT_FUNNELS permission or Owner/Admin role in workspace
- Original password is never stored, only the hash

---

## 4. Unlock Funnel (Remove Password Protection)

**Route:** `POST /api/funnel-settings/unlock-funnel/:funnelId`  
**Authentication:** Required

### URL Parameters

| Field      | Type   | Required | Description           |
| ---------- | ------ | -------- | --------------------- |
| `funnelId` | number | Yes      | Funnel ID to unlock   |

### Response

```json
{
  "message": "Funnel unlocked successfully",
  "success": true
}
```

### Notes

- **Removes password protection**: Sets `isPasswordProtected` to false and clears `passwordHash`
- **Immediate effect**: Funnel becomes publicly accessible after unlock
- Requires EDIT_FUNNELS permission or Owner/Admin role in workspace
- Funnel settings must exist (cannot unlock non-existent settings)

---

## 5. Verify Funnel Password

**Route:** `POST /api/funnel-settings/verify-password/:funnelId`  
**Authentication:** Not required (Public)

### URL Parameters

| Field      | Type   | Required | Description                     |
| ---------- | ------ | -------- | ------------------------------- |
| `funnelId` | number | Yes      | Funnel ID to verify password for |

### Request Body

| Field      | Type   | Required | Description              |
| ---------- | ------ | -------- | ------------------------ |
| `password` | string | Yes      | Password to verify       |

### Response

```json
{
  "valid": true,
  "message": "Password is correct"
}
```

**Failed verification:**
```json
{
  "valid": false,
  "message": "Invalid password"
}
```

**Funnel not password protected:**
```json
{
  "valid": true,
  "message": "Funnel is not password protected"
}
```

### Notes

- **Public endpoint** - no authentication required
- **Session cookie**: Sets funnel access session cookie on successful verification
- **Secure verification**: Uses bcrypt to compare against stored hash
- **Graceful handling**: Returns success if funnel is not password protected
- Used by public funnel viewers to gain access to protected content

---

## Cache Keys

### Primary Keys

- `funnel:{funnelId}:settings:full` - Complete funnel settings
- `workspace:{workspaceId}:funnel:{funnelId}:full` - Funnel cache (invalidated on settings update)

### Cache Operations

| Operation           | Cache Updates                                                    |
| ------------------- | ---------------------------------------------------------------- |
| Get Settings        | 1. Reads from cache<br>2. Falls back to DB and creates cache    |
| Update Settings     | 1. Updates settings cache<br>2. Invalidates funnel cache        |
| Lock Funnel         | 1. No direct cache update (settings cache updated on next read) |
| Unlock Funnel       | 1. No direct cache update (settings cache updated on next read) |
| Verify Password     | 1. Read-only operation (no cache changes)                       |

---

## Auto-Creation Rules

### Funnel Settings Creation

- **Automatic**: Settings are created automatically when a funnel is created
- **Default values**: All optional fields default to null or appropriate defaults
- **Password protection**: Defaults to false (unlocked)
- **Language**: Defaults to "en" (English)
- **Timezone**: Defaults to "UTC"
- **Date format**: Defaults to "DD.MM.YYYY"

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
- **404** - Funnel or settings not found
- **500** - Server error

### Specific Error Messages

- "Invalid funnel ID" - Funnel ID is not a valid number
- "User ID is required" - Missing authentication for protected endpoints
- "Funnel not found" - Funnel doesn't exist
- "Funnel settings not found" - Settings don't exist for funnel
- "You don't have access to this funnel" - User lacks workspace membership
- "You don't have permission to modify settings" - Insufficient permissions
- "Password must be at least 6 characters long" - Password validation
- "Privacy policy must be a valid URL" - URL validation
- "Invalid data provided" - General validation error

---

## Permission Requirements

| Operation           | Required Permission                              |
| ------------------- | ------------------------------------------------ |
| Get Settings        | None (public endpoint)                           |
| Update Settings     | `EDIT_FUNNELS` or Owner/Admin role in workspace  |
| Lock Funnel         | `EDIT_FUNNELS` or Owner/Admin role in workspace  |
| Unlock Funnel       | `EDIT_FUNNELS` or Owner/Admin role in workspace  |
| Verify Password     | None (public endpoint)                           |

### Workspace Access Rules

- **Workspace Owner**: Full access to all funnel settings
- **Admin Role**: Full access to all funnel settings  
- **Editor Role**: Access if has `EDIT_FUNNELS` permission
- **Viewer Role**: Access if has `EDIT_FUNNELS` permission
- **No Membership**: No access to protected endpoints

---

## Validation Rules

### Password Requirements

- **Minimum length**: 6 characters
- **Maximum length**: 100 characters
- **Secure storage**: Bcrypt hashed with 10 salt rounds

### URL Fields

- **Privacy Policy URL**: Must be valid URL format or empty string/null
- **Terms of Service URL**: Must be valid URL format or empty string/null
- **Empty strings**: Automatically converted to null for consistency

### SEO Fields

- **No length limits**: SEO fields accept any length strings
- **Nullable**: All SEO fields can be set to null

### Tracking IDs

- **Google Analytics**: Accepts any string format
- **Facebook Pixel**: Accepts any string format
- **Custom Scripts**: Array of script strings, no validation on content

### Regional Settings

- **Language**: Any string (typically ISO language codes)
- **Timezone**: Any string (typically timezone identifiers)
- **Date Format**: Any string (typically format patterns)

---

## Security Considerations

### Password Protection

- **Hash only**: Original passwords are never stored
- **Salt rounds**: Uses 10 rounds for secure hashing
- **Session cookies**: Set on successful password verification
- **Public verification**: Allows checking passwords without authentication

### Data Exposure

- **Password hash**: Never included in API responses
- **Public settings**: All other settings are publicly accessible
- **Tracking codes**: Exposed in public responses (expected for web integration)

### Permission Checks

- **Workspace validation**: Verifies user belongs to workspace
- **Role-based access**: Checks user role and permissions
- **Owner privileges**: Workspace owners bypass permission checks
- **Admin privileges**: Admin role users bypass permission checks