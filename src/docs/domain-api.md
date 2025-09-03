# Domain API Documentation

## Overview

Domain management system for custom domains and subdomains in the funnel builder platform. Handles domain creation, verification, DNS configuration, and funnel connection management. Integrates with Cloudflare for custom domain hosting and SSL certificates.

All routes require `authenticateToken` middleware for user authentication.

---

## Domain Management Routes

### 1. Create Custom Domain

**Route:** `POST /api/domains/create-custom-domain`  
**Authentication:** Required

### Request Body

| Field         | Type   | Required | Description                    |
| ------------- | ------ | -------- | ------------------------------ |
| `hostname`    | string | Yes      | Valid hostname (e.g., example.com) |
| `workspaceId` | number | Yes      | Workspace ID (positive integer) |

### Response

```json
{
  "message": "Custom domain created successfully",
  "domain": {
    "id": 123,
    "hostname": "example.com",
    "type": "CUSTOM",
    "status": "PENDING",
    "sslStatus": "PENDING",
    "isVerified": false,
    "isActive": false,
    "verificationToken": "abc123...",
    "customHostnameId": "cf-hostname-id",
    "ownershipVerification": {...},
    "cnameVerificationInstructions": {...},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "setupInstructions": {
    "records": [
      {
        "type": "TXT",
        "name": "_cf-custom-hostname.example.com",
        "value": "verification-token-here",
        "purpose": "Domain ownership verification"
      },
      {
        "type": "CNAME",
        "name": "example.com",
        "value": "target.cloudflare.com",
        "purpose": "Traffic routing to Cloudflare"
      }
    ]
  }
}
```

### Notes

- Creates custom domain with Cloudflare integration
- Validates hostname format and uniqueness
- Checks user domain limits based on subscription plan
- Returns DNS setup instructions for domain verification
- Domain starts in PENDING status until DNS verification

---

### 2. Create Subdomain

**Route:** `POST /api/domains/create-subdomain`  
**Authentication:** Required

### Request Body

| Field         | Type   | Required | Description                    |
| ------------- | ------ | -------- | ------------------------------ |
| `subdomain`   | string | Yes      | Subdomain name (a-z, 0-9, hyphens only) |
| `workspaceId` | number | Yes      | Workspace ID (positive integer) |

### Response

```json
{
  "message": "Subdomain created successfully",
  "domain": {
    "id": 124,
    "hostname": "mysite.mydigitalsite.io",
    "type": "SUBDOMAIN",
    "status": "VERIFIED",
    "sslStatus": "ACTIVE",
    "isVerified": true,
    "isActive": true,
    "cloudflareRecordId": "cf-record-id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Notes

- Creates subdomain under `mydigitalsite.io`
- Automatically creates Cloudflare DNS record
- Subdomain is immediately active and verified
- Validates subdomain format and uniqueness
- Checks user subdomain limits based on subscription plan

---

### 3. Get All Domains

**Route:** `GET /api/domains`  
**Authentication:** Required

### Query Parameters

| Field       | Type   | Required | Default | Description                    |
| ----------- | ------ | -------- | ------- | ------------------------------ |
| `workspaceId` | number | Yes      | -       | Workspace ID                   |
| `page`      | number | No       | 1       | Page number for pagination     |
| `limit`     | number | No       | 10      | Items per page (max 100)       |
| `filters`   | object | No       | {}      | Filter criteria                |
| `sortBy`    | string | No       | createdAt | Sort field (createdAt, hostname, status) |
| `sortOrder` | string | No       | desc    | Sort order (asc, desc)         |

### Filter Object

| Field      | Type   | Description                    |
| ---------- | ------ | ------------------------------ |
| `status`   | enum   | Domain status (PENDING, VERIFIED, ACTIVE) |
| `type`     | enum   | Domain type (CUSTOM, SUBDOMAIN) |
| `hostname` | string | Filter by hostname substring   |

### Response

```json
{
  "domains": [
    {
      "id": 123,
      "hostname": "example.com",
      "type": "CUSTOM",
      "status": "ACTIVE",
      "workspaceId": 1
    },
    {
      "id": 124,
      "hostname": "mysite.mydigitalsite.io",
      "type": "SUBDOMAIN", 
      "status": "VERIFIED",
      "workspaceId": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "filters": {
    "status": "ACTIVE",
    "type": null,
    "hostname": null
  }
}
```

### Notes

- Returns paginated list of domains for workspace
- Supports filtering by status, type, and hostname
- Supports sorting by creation date, hostname, or status
- Requires workspace access permissions

---

### 4. Delete Domain

**Route:** `DELETE /api/domains/:domainId`  
**Authentication:** Required

### URL Parameters

| Field      | Type   | Required | Description |
| ---------- | ------ | -------- | ----------- |
| `domainId` | number | Yes      | Domain ID   |

### Request Body

| Field         | Type   | Required | Description                    |
| ------------- | ------ | -------- | ------------------------------ |
| `workspaceId` | number | Yes      | Workspace ID for validation    |

### Response

```json
{
  "message": "Domain deleted successfully"
}
```

### Notes

- Permanently deletes domain and associated records
- Removes Cloudflare custom hostname if applicable
- Checks domain ownership and workspace permissions
- Cascade deletes any funnel connections to this domain

---

### 5. Verify Domain

**Route:** `POST /api/domains/verify/:domainId`  
**Authentication:** Required

### URL Parameters

| Field      | Type   | Required | Description |
| ---------- | ------ | -------- | ----------- |
| `domainId` | number | Yes      | Domain ID   |

### Request Body

| Field         | Type   | Required | Description                    |
| ------------- | ------ | -------- | ------------------------------ |
| `workspaceId` | number | Yes      | Workspace ID for validation    |

### Response

```json
{
  "message": "Domain is fully configured and active.",
  "domain": {
    "id": 123,
    "hostname": "example.com",
    "status": "ACTIVE",
    "sslStatus": "ACTIVE",
    "isVerified": true,
    "isActive": true,
    "lastVerifiedAt": "2024-01-01T12:00:00.000Z"
  },
  "isFullyActive": true,
  "nextStep": null
}
```

### Response (Pending SSL)

```json
{
  "message": "Domain ownership verified. Please add the SSL validation records to complete setup.",
  "domain": {
    "id": 123,
    "hostname": "example.com", 
    "status": "VERIFIED",
    "sslStatus": "PENDING",
    "isVerified": true,
    "isActive": false,
    "lastVerifiedAt": "2024-01-01T12:00:00.000Z"
  },
  "isFullyActive": false,
  "nextStep": {
    "txt_name": "_acme-challenge.example.com",
    "txt_value": "validation-token",
    "http_url": "http://example.com/.well-known/acme-challenge/token",
    "http_body": "validation-content",
    "cname_target": "validation.cloudflare.com",
    "cname_name": "_acme-challenge"
  }
}
```

### Notes

- Checks domain verification status with Cloudflare
- Updates domain status and SSL status in database
- Returns next steps if verification incomplete
- Provides SSL validation records when needed

---

### 6. Get DNS Instructions

**Route:** `GET /api/domains/dns-instructions/:domainId`  
**Authentication:** Required

### URL Parameters

| Field      | Type   | Required | Description |
| ---------- | ------ | -------- | ----------- |
| `domainId` | number | Yes      | Domain ID   |

### Query Parameters

| Field         | Type   | Required | Description                    |
| ------------- | ------ | -------- | ------------------------------ |
| `workspaceId` | number | Yes      | Workspace ID for validation    |

### Response

```json
{
  "instructions": [
    {
      "type": "TXT",
      "name": "_cf-custom-hostname.example.com",
      "value": "abc123def456...",
      "purpose": "Verify domain ownership",
      "priority": 1
    },
    {
      "type": "CNAME", 
      "name": "example.com",
      "value": "target.cloudflare.net",
      "purpose": "Route traffic to Cloudflare",
      "priority": 2
    }
  ],
  "domain": {
    "id": 123,
    "hostname": "example.com",
    "status": "PENDING",
    "isVerified": false,
    "isActive": false
  }
}
```

### Notes

- Provides current DNS setup instructions for domain
- Instructions change based on verification status
- Only available for custom domains (not subdomains)
- Requires domain ownership within workspace

---

## Domain-Funnel Connection Routes

### 7. Connect Domain to Funnel

**Route:** `POST /api/domain-funnel/connect`  
**Authentication:** Required

### Request Body

| Field         | Type   | Required | Description                    |
| ------------- | ------ | -------- | ------------------------------ |
| `funnelId`    | number | Yes      | Funnel ID (positive integer)   |
| `domainId`    | number | Yes      | Domain ID (positive integer)   |
| `workspaceId` | number | Yes      | Workspace ID (positive integer) |

### Response

```json
{
  "message": "Domain connected to funnel successfully"
}
```

### Notes

- Creates connection between domain and funnel
- Validates both domain and funnel belong to workspace
- Requires CONNECT_DOMAINS workspace permission
- Domain must be active and verified
- One domain can connect to multiple funnels

---

### 8. Get Domain-Funnel Connections

**Route:** `GET /api/domain-funnel/connections`  
**Authentication:** Required

### Query Parameters

| Field         | Type   | Required | Description                    |
| ------------- | ------ | -------- | ------------------------------ |
| `workspaceId` | number | Yes      | Workspace ID for filtering     |

### Response

```json
{
  "connections": [
    {
      "funnelId": 456,
      "funnelName": "Sales Funnel",
      "domainId": 123,
      "domainName": "example.com"
    },
    {
      "funnelId": 789,
      "funnelName": "Lead Magnet",
      "domainId": 124,
      "domainName": "leads.mydigitalsite.io"
    }
  ]
}
```

### Notes

- Returns all domain-funnel connections for workspace
- Shows which domains are connected to which funnels
- Requires workspace access permissions
- Useful for connection management and overview

---

## Domain Types & Status

### Domain Types

- **CUSTOM**: User-owned domains (e.g., example.com)
- **SUBDOMAIN**: Platform subdomains (e.g., site.mydigitalsite.io)

### Domain Status

- **PENDING**: Domain created, awaiting DNS verification
- **VERIFIED**: DNS ownership verified, SSL may be pending
- **ACTIVE**: Fully configured and operational

### SSL Status

- **PENDING**: SSL certificate being provisioned
- **ACTIVE**: SSL certificate active and valid
- **ERROR**: SSL configuration failed

---

## Cloudflare Integration

### Custom Domain Flow

1. User creates custom domain
2. Cloudflare custom hostname created
3. DNS verification records provided to user
4. User adds DNS records to their domain
5. System verifies ownership via Cloudflare API
6. SSL certificate automatically provisioned
7. Domain becomes active and ready for use

### Subdomain Flow

1. User creates subdomain
2. DNS record created in Cloudflare zone
3. SSL automatically active (wildcard certificate)
4. Subdomain immediately available

---

## Authentication & Security

### Required Permissions

- **Domain Management**: General domain operations
- **CONNECT_DOMAINS**: Required for domain-funnel connections
- **Workspace Access**: User must have access to target workspace

### Rate Limiting

- Domain creation: Limited by user subscription plan
- API requests: Standard rate limiting applies
- Cloudflare API: Respects Cloudflare rate limits

---

## Error Responses

### Common HTTP Status Codes

- **400**: Bad Request (validation errors, invalid data)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions, limit exceeded)
- **404**: Not Found (domain/funnel not found)
- **409**: Conflict (domain already exists)
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error (database/Cloudflare errors)

### Example Error Response

```json
{
  "error": "Domain already exists in the system"
}
```

### Validation Error Response

```json
{
  "error": "Hostname must be a valid domain name"
}
```

---

## Environment Variables

| Variable                    | Required | Description                      |
| --------------------------- | -------- | -------------------------------- |
| `CLOUDFLARE_API_TOKEN`      | Yes      | Cloudflare API token with DNS permissions |
| `CLOUDFLARE_ZONE_ID`        | Yes      | Zone ID for mydigitalsite.io     |
| `CLOUDFLARE_DOMAIN`         | Yes      | Base domain (mydigitalsite.io)   |
| `DATABASE_URL`              | Yes      | PostgreSQL connection string     |
| `JWT_SECRET`                | Yes      | JWT signing secret               |

---

## Subscription Limits

### Business Plan
- **Custom Domains**: 5
- **Subdomains**: 10

### Agency Plan  
- **Custom Domains**: 25
- **Subdomains**: 50

### Custom Limits
- Limits can be customized per user
- Checked during domain creation
- Enforced at API level

---

## DNS Setup Examples

### Custom Domain Setup

**Step 1: Ownership Verification**
```
Type: TXT
Name: _cf-custom-hostname.example.com
Value: abc123def456...
```

**Step 2: Traffic Routing**
```
Type: CNAME
Name: example.com (or @)
Value: target.cloudflare.net
```

### Subdomain Setup

Automatic - no DNS setup required by user.