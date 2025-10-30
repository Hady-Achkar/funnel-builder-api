/**
 * Cloudflare API Module
 *
 * Centralized Cloudflare API operations with type safety and validation.
 * All functions use Zod schemas for input/output validation.
 *
 * @module api/cloudflare
 */

// ============================================================================
// Core Configuration
// ============================================================================

export { validateConfig } from "./getConfig";
export { getAxiosInstance } from "./getAxiosInstance";

// ============================================================================
// Zone Operations
// ============================================================================

export { getZoneId, clearZoneCache } from "./getZoneId";

// ============================================================================
// DNS Record Operations
// ============================================================================

export { createRecord } from "./createRecord";
export { deleteRecord } from "./deleteRecord";
export { createARecord } from "./createARecord";
export { deleteARecord } from "./deleteARecord";

// ============================================================================
// Custom Hostname Operations (SSL for SaaS)
// ============================================================================

export { addCustomHostname } from "./addCustomHostname";
export { getCustomHostnameDetails } from "./getCustomHostnameDetails";
export { deleteCustomHostname } from "./deleteCustomHostname";

// ============================================================================
// Workspace Subdomain Operations
// ============================================================================

export { createWorkspaceSubdomain } from "./createWorkspaceSubdomain";
export { deleteWorkspaceSubdomain } from "./deleteWorkspaceSubdomain";

// ============================================================================
// Verification & Status Helpers
// ============================================================================

export { determineVerificationStatus } from "./determineVerificationStatus";
export { getStatusUpdateData } from "./getStatusUpdateData";

// ============================================================================
// Types
// ============================================================================

export * from "./types";
