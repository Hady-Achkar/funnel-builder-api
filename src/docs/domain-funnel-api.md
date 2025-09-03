# Domain-Funnel API Documentation

## Overview

Domain-Funnel connection system that allows linking verified domains to live funnels in the platform. This system manages the relationships between domains and funnels, enabling users to serve their funnels through custom domains or subdomains.

All routes require `authenticateToken` middleware for user authentication and appropriate workspace permissions.

---

## Domain-Funnel Connection Routes

### 1. Connect Domain to Funnel

**Route:** `POST /api/domain-funnel/connect`  
**Authentication:** Required  
**Permission:** `CONNECT_DOMAINS`

Connects a verified domain to a live funnel. Only one domain can be connected to a funnel at a time - connecting a new domain will disconnect any previously connected domain from the funnel.

### Request Body

| Field         | Type   | Required | Description                    |
| ------------- | ------ | -------- | ------------------------------ |
| `funnelId`    | number | Yes      | Funnel ID (positive integer)   |
| `domainId`    | number | Yes      | Domain ID (positive integer)   |
| `workspaceId` | number | Yes      | Workspace ID (positive integer) |

### Validation Requirements

- **Funnel**: Must exist, belong to workspace, and have `LIVE` status
- **Domain**: Must exist, belong to workspace, have `ACTIVE` status (not `PENDING`)
- **User**: Must have `CONNECT_DOMAINS` permission for the workspace
- **Connection**: Funnel cannot already be connected to the same domain

### Response

```json
{
  "message": "Funnel connected successfully"
}
```

### Error Examples

```json
// Funnel not found or not accessible
{
  "message": "Funnel not found or you don't have access to it",
  "statusCode": 404
}

// Funnel not live
{
  "message": "Funnel must be LIVE before connecting to a domain",
  "statusCode": 400
}

// Domain not verified/active
{
  "message": "Domain must be active before connecting to a funnel",
  "statusCode": 400
}

// Already connected
{
  "message": "This funnel is already connected to this domain",
  "statusCode": 400
}
```

---

### 2. Get Domain-Funnel Connections

**Route:** `GET /api/domain-funnel/connections/:workspaceId`  
**Authentication:** Required  
**Permission:** Workspace access

Retrieves all domain-funnel connections for a specific workspace, showing which domains are connected to which funnels.

### URL Parameters

| Parameter     | Type   | Required | Description                    |
| ------------- | ------ | -------- | ------------------------------ |
| `workspaceId` | number | Yes      | Workspace ID (positive integer) |

### Response

```json
{
  "connections": [
    {
      "funnelId": 123,
      "funnelName": "Lead Generation Funnel",
      "domainId": 456,
      "domainName": "example.com"
    },
    {
      "funnelId": 789,
      "funnelName": "Product Launch Funnel",
      "domainId": 101,
      "domainName": "product.mydigitalsite.io"
    }
  ]
}
```

### Response Fields

| Field        | Type   | Description                     |
| ------------ | ------ | ------------------------------- |
| `funnelId`   | number | ID of the connected funnel      |
| `funnelName` | string | Name of the connected funnel    |
| `domainId`   | number | ID of the connected domain      |
| `domainName` | string | Hostname of the connected domain |

---

## Business Logic

### Connection Rules

1. **One-to-One Mapping**: Each funnel can only be connected to one domain at a time
2. **Domain Reuse**: Multiple funnels can be connected to different domains, but each domain can only be connected to one funnel
3. **Automatic Disconnection**: Connecting a funnel to a new domain automatically disconnects it from any previously connected domain
4. **Status Requirements**: 
   - Funnel must have `LIVE` status
   - Domain must have `ACTIVE` status (verified and ready)

### Validation Flow

```
1. Validate request data (Zod schema)
2. Check workspace access permissions
3. Validate funnel exists and is LIVE
4. Validate domain exists and is ACTIVE
5. Check for existing exact connection (prevent duplicates)
6. Remove any existing connections for the funnel
7. Create new connection with isActive: true
```

---

## Authentication & Security

### Required Permissions

- **CONNECT_DOMAINS**: Required for connecting domains to funnels
- **Workspace Access**: User must have access to the target workspace
- Both funnel and domain must belong to the same workspace

### Workspace Validation

All operations validate that:
- User has access to the specified workspace
- Both funnel and domain belong to the same workspace
- User has appropriate permissions for the operation

---

## Integration Notes

### Database Relations

The domain-funnel system uses the `funnelDomain` table:
- Links `funnel` and `domain` entities
- Tracks `isActive` status for connections
- Supports historical connection tracking

### Transaction Safety

Connection operations use database transactions to ensure:
- Atomic operations (all changes succeed or fail together)
- Consistent state (no orphaned connections)
- Data integrity across related tables

### Error Handling

All endpoints use consistent error handling:
- Zod validation for request data
- Custom HTTP errors for business logic violations
- Proper status codes and descriptive messages
- Transaction rollback on failures

---

## Example Usage

### Connecting a Funnel to a Custom Domain

```bash
# Connect funnel ID 123 to custom domain ID 456
curl -X POST http://localhost:4444/api/domain-funnel/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "funnelId": 123,
    "domainId": 456,
    "workspaceId": 789
  }'
```

### Getting All Connections for a Workspace

```bash
# Get all connections for workspace 789
curl -X GET http://localhost:4444/api/domain-funnel/connections/789 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Related APIs

- **Domain Management**: `/api/domains/*` - For creating and managing domains
- **Funnel Management**: `/api/funnels/*` - For creating and managing funnels
- **Workspace Management**: `/api/workspaces/*` - For workspace permissions