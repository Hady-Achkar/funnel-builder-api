# Cloudflare API Module

Centralized Cloudflare API operations with type safety, validation, and consistent error handling.

## Overview

This module provides a clean, typed interface to all Cloudflare operations used in the application. All functions use Zod schemas for validation and return properly typed results.

## Structure

```tree
src/api/cloudflare/
├── index.ts                           # Main exports
├── types/index.ts                     # Type definitions and Zod schemas
├── getConfig/index.ts                 # Configuration helpers
├── getAxiosInstance/index.ts          # Axios instance factory
├── getZoneId/index.ts                 # Zone ID lookup
├── createRecord/index.ts              # Generic DNS record creation
├── deleteRecord/index.ts              # Generic DNS record deletion
├── createARecord/index.ts             # A record creation
├── deleteARecord/index.ts             # A record deletion
├── addCustomHostname/index.ts         # Custom hostname creation (SSL for SaaS)
├── getCustomHostnameDetails/index.ts  # Get custom hostname status
├── deleteCustomHostname/index.ts      # Delete custom hostname
├── createWorkspaceSubdomain/index.ts  # Workspace subdomain creation
├── deleteWorkspaceSubdomain/index.ts  # Workspace subdomain deletion
├── determineVerificationStatus/index.ts # Verification status logic
└── getStatusUpdateData/index.ts       # Database status mapping
```

## Usage Examples

### Basic Configuration

```typescript
import {
  getConfig,
  getWorkspaceConfig,
  getCustomHostnameConfig,
} from "@/api/cloudflare";

// Get default config from environment
const config = getConfig();

// Get workspace-specific config
const workspaceConfig = getWorkspaceConfig();

// Get custom hostname config
const customHostnameConfig = getCustomHostnameConfig();
```

### DNS Operations

```typescript
import { createARecord, deleteARecord, getZoneId } from "@/api/cloudflare";

// Create an A record
const record = await createARecord(
  "subdomain",
  "zone-id-123",
  "192.0.2.1",
  { apiToken: process.env.CF_API_TOKEN! },
  { ttl: 3600, proxied: true }
);

// Delete an A record
await deleteARecord("record-id-456", "zone-id-123", {
  apiToken: process.env.CF_API_TOKEN!,
});

// Get zone ID for a domain
const zoneId = await getZoneId("example.com", {
  apiToken: process.env.CF_API_TOKEN!,
});
```

### Custom Domains (SSL for SaaS)

```typescript
import {
  addCustomHostname,
  getCustomHostnameDetails,
  deleteCustomHostname,
} from "@/api/cloudflare";

// Add a custom hostname
const hostname = await addCustomHostname(
  "example.com",
  "zone-id-123",
  { apiToken: process.env.CF_API_TOKEN! },
  {
    sslMethod: "txt",
    customOriginServer: "origin.myapp.com",
  }
);

// Get custom hostname details
const details = await getCustomHostnameDetails(
  "custom-hostname-id",
  "zone-id-123",
  { apiToken: process.env.CF_API_TOKEN! }
);

// Delete custom hostname
await deleteCustomHostname("custom-hostname-id", "zone-id-123", {
  apiToken: process.env.CF_API_TOKEN!,
});
```

### Workspace Subdomains (DEPRECATED)

**Note:** Workspace subdomains are now managed in the database, not Cloudflare DNS. The functions below are kept for backward compatibility with custom domains but should NOT be used for workspace subdomain management.

```typescript
import {
  createWorkspaceSubdomain,
  deleteWorkspaceSubdomain,
} from "@/api/cloudflare";

// DEPRECATED: These functions are no longer used for workspace subdomains
// Workspace subdomains are now created as database records only
// See: Domain model with type="WORKSPACE_SUBDOMAIN"
```

### Verification Status

```typescript
import {
  determineVerificationStatus,
  getStatusUpdateData,
} from "@/api/cloudflare";

// Determine verification status
const status = determineVerificationStatus("active", "pending_validation", [
  { txt_name: "_acme-challenge", txt_value: "..." },
]);

console.log(status.message); // "DNS verified! SSL certificate is being issued."
console.log(status.isFullyActive); // false
console.log(status.nextStep); // { txt_name: "...", txt_value: "..." }

// Get database update data
const dbData = getStatusUpdateData("active", "active", status);

await prisma.domain.update({
  where: { id: domainId },
  data: dbData,
});
```

## Environment Variables

### Required

- `CF_API_TOKEN` - Cloudflare API token

### Optional

- `CF_ACCOUNT_ID` - Cloudflare account ID
- `CF_ZONE_ID` - Default zone ID
- `CF_SUBDOMAIN` - Default domain (e.g., "digitalsite.app")
- `CF_ZONE_ID` - Zone ID for custom hostnames

### Workspace-Specific

- `WORKSPACE_DOMAIN` - Workspace domain (e.g., "digitalsite.io") - Used for database subdomain records only

## Type Safety

All functions use Zod for runtime validation:

```typescript
import {
  CloudflareConfig,
  DNSRecord,
  CustomHostnameResult,
} from "@/api/cloudflare";

// Types are automatically inferred from Zod schemas
const config: CloudflareConfig = getConfig();

// Input validation
const record: DNSRecord = {
  type: "A",
  name: "subdomain",
  content: "192.0.2.1",
  ttl: 3600,
  proxied: true,
};
// Zod validates this at runtime ✓
```

## Error Handling

All functions throw descriptive errors:

```typescript
try {
  await createARecord(...);
} catch (error) {
  // Cloudflare API errors include detailed messages
  console.error(error.message);
  // "CloudFlare createRecord error: Invalid zone ID"
}
```

## Migration Path

This module duplicates existing functionality to allow gradual migration:

1. **Phase 1**: New API structure created (current)
2. **Phase 2**: Gradually replace old imports with new ones
3. **Phase 3**: Remove old utility files once all code is migrated

## Benefits

- ✅ **Type Safety**: Full TypeScript + Zod validation
- ✅ **Centralized**: All Cloudflare operations in one place
- ✅ **Consistent**: Same patterns across all functions
- ✅ **Flexible**: Easy to pass different zone IDs/configs
- ✅ **Documented**: JSDoc comments on all functions
- ✅ **Testable**: Clean interfaces for easy mocking
