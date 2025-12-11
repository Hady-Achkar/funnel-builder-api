# Auth API Documentation

## Overview

Authentication and user management routes for funnel builder. Handles user registration, login, email verification, password reset, and user profile management.
All routes except public authentication endpoints require `authenticateToken` middleware.

---

## 1. Register User

**Route:** `POST /api/auth/register`  
**Authentication:** Not Required

### Request Body

| Field                   | Type    | Required | Default   | Description                                    |
| ----------------------- | ------- | -------- | --------- | ---------------------------------------------- |
| `email`                 | string  | Yes      | -         | Valid email address (auto-lowercased)         |
| `username`              | string  | Yes      | -         | Username 3-30 chars (a-z, 0-9, _)             |
| `firstName`             | string  | Yes      | -         | First name (1-100 chars)                      |
| `lastName`              | string  | Yes      | -         | Last name (1-100 chars)                       |
| `password`              | string  | Yes      | -         | Password (min 6 chars)                        |
| `isAdmin`               | boolean | No       | false     | Admin privileges                               |
| `plan`                  | enum    | No       | BUSINESS  | User plan (BUSINESS or AGENCY)                 |
| `maximumFunnels`        | number  | No       | Plan def. | Custom funnel limit                            |
| `maximumCustomDomains`  | number  | No       | Plan def. | Custom domain limit                            |
| `maximumSubdomains`     | number  | No       | Plan def. | Custom subdomain limit                         |

### Response

```json
{
  "message": "User created successfully. Please check your email to verify your account.",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "username": "testuser",
    "firstName": "John",
    "lastName": "Doe",
    "isAdmin": false,
    "plan": "BUSINESS",
    "verified": false
  }
}
```

### Notes

- Creates user account with personal workspace
- Assigns workspace owner role with full permissions
- Creates default image folder
- Sends verification email via SendGrid
- User must verify email before login
- Plan limits determine workspace allocation

---

## 2. Login User

**Route:** `POST /api/auth/login`  
**Authentication:** Not Required

### Request Body

| Field        | Type   | Required | Description                    |
| ------------ | ------ | -------- | ------------------------------ |
| `identifier` | string | Yes      | Email or username (lowercased) |
| `password`   | string | Yes      | User password                  |

### Response

```json
{
  "message": "Login successful",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "username": "testuser",
    "firstName": "John",
    "lastName": "Doe",
    "isAdmin": false
  }
}
```

### Cookies Set

- **authToken**: HTTP-only cookie with JWT token (30 days expiry)

### Notes

- Validates password using bcrypt
- Requires verified email address
- Sets secure HTTP-only auth cookie
- JWT token expires in 180 days
- Returns user info without sensitive data

---

## 3. Logout User

**Route:** `POST /api/auth/logout`  
**Authentication:** Not Required

### Request Body

None required

### Response

```json
{
  "message": "Logged out successfully"
}
```

### Notes

- Clears authToken HTTP-only cookie
- No server-side session tracking
- Client-side should clear any cached user data

---

## 4. Verify Email

**Route:** `POST /api/auth/verify`  
**Authentication:** Not Required

### Request Body (Query String)

| Field   | Type   | Required | Description                |
| ------- | ------ | -------- | -------------------------- |
| `token` | string | Yes      | Base64 verification token  |

### Response

```json
{
  "message": "Email verified successfully",
  "verified": true
}
```

### Cookies Set

- **authToken**: HTTP-only cookie with JWT token (30 days expiry)

### Notes

- Validates base64 token with email/password/timestamp
- Token expires after 24 hours
- Auto-logs in user after verification
- Sets user as verified in database
- Clears verification token after success

---

## 5. Forgot Password

**Route:** `POST /api/auth/forgot-password`  
**Authentication:** Not Required

### Request Body

| Field   | Type   | Required | Description      |
| ------- | ------ | -------- | ---------------- |
| `email` | string | Yes      | User email       |

### Response

```json
{
  "message": "If an account with that email exists and is verified, you will receive a password reset link shortly."
}
```

### Notes

- Always returns success message for security
- Only sends email if user exists and is verified
- Generates base64 reset token with 1-hour expiry
- Sends password reset email via SendGrid
- Token contains email and timestamp

---

## 6. Reset Password

**Route:** `POST /api/auth/reset-password`  
**Authentication:** Not Required

### Request Body

| Field             | Type   | Required | Description               |
| ----------------- | ------ | -------- | ------------------------- |
| `token`           | string | Yes      | Base64 reset token        |
| `password`        | string | Yes      | New password (min 6 chars)|
| `confirmPassword` | string | Yes      | Must match password       |

### Response

```json
{
  "message": "Password reset successfully"
}
```

### Cookies Set

- **authToken**: HTTP-only cookie with JWT token (30 days expiry)

### Notes

- Validates reset token (1-hour expiry)
- Validates password confirmation match
- Updates password with bcrypt hash
- Auto-logs in user after reset
- Clears reset token after success

---

## 7. Get User Profile

**Route:** `GET /api/auth/user/profile`  
**Authentication:** Required

### Response

```json
{
  "user": {
    "id": 123,
    "email": "user@example.com",
    "username": "testuser",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Notes

- Requires valid JWT token in authToken cookie
- Returns current user profile information
- Does not include sensitive data (password, tokens)

---

## 8. Update User Profile

**Route:** `PUT /api/auth/user/profile`  
**Authentication:** Required

### Request Body

| Field       | Type   | Required | Description    |
| ----------- | ------ | -------- | -------------- |
| `firstName` | string | No       | First name     |
| `lastName`  | string | No       | Last name      |
| `email`     | string | No       | Email address  |

### Response

```json
{
  "user": {
    "id": 123,
    "email": "updated@example.com",
    "username": "testuser",
    "firstName": "Updated",
    "lastName": "Name",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Notes

- Only provided fields are updated
- Email uniqueness is validated
- Username cannot be changed
- Returns updated user profile

---

## 9. Delete User Account

**Route:** `DELETE /api/auth/user/account`  
**Authentication:** Required

### Response

```json
{
  "message": "Account deleted successfully"
}
```

### Notes

- Permanently deletes user account
- Cascade deletes all user-created funnels
- Cascade deletes all user-created domains
- Cascade deletes all user-created templates
- Uses database transaction for data integrity
- Action is irreversible

---

## Authentication & Security

### Cookie Settings

- **Name**: `authToken`
- **HTTP-Only**: Yes (prevents XSS access)
- **Secure**: Yes in production (HTTPS only)
- **SameSite**: Strict (CSRF protection)
- **Max-Age**: 30 days
- **Path**: `/` (site-wide)

### JWT Token

- **Algorithm**: Default (usually HS256)
- **Expiry**: 180 days
- **Payload**: `{ userId: number }`
- **Secret**: Environment variable `JWT_SECRET`

### Password Security

- **Hashing**: bcrypt with salt rounds = 10
- **Minimum Length**: 6 characters
- **No complexity requirements** (configurable)

### Email Integration

- **Provider**: SendGrid
- **Templates**: 
  - Verification: `d-0ec5ea02e0e14ef380469a2ab63917d4`
  - Password Reset: `d-ca1cbed91a944936a97c1492783a6f38`
- **From Address**: Environment variable `SENDGRID_FROM_EMAIL`

---

## Error Responses

### Common HTTP Status Codes

- **400**: Bad Request (validation errors, invalid data)
- **401**: Unauthorized (invalid/missing token)
- **404**: Not Found (user not found)
- **500**: Internal Server Error (database/system errors)

### Example Error Response

```json
{
  "error": "Invalid credentials"
}
```

---

## Environment Variables

| Variable              | Required | Description                    |
| --------------------- | -------- | ------------------------------ |
| `JWT_SECRET`          | Yes      | JWT signing secret             |
| `SENDGRID_API_KEY`    | Yes      | SendGrid API key               |
| `SENDGRID_FROM_EMAIL` | Yes      | Sender email address           |
| `FRONTEND_URL`        | Yes      | Frontend URL for email links   |
| `NODE_ENV`            | No       | Environment (affects cookies)  |