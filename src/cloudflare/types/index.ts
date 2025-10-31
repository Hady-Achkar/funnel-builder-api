import { z } from "zod";
import { DomainStatus, SslStatus } from "../../generated/prisma-client";

/**
 * Cloudflare API Types
 * Centralized type definitions for all Cloudflare API operations
 */

// ============================================================================
// Configuration Schemas
// ============================================================================

export const CloudflareConfigSchema = z.object({
  apiToken: z.string().min(1, "API token is required"),
  accountId: z.string().optional(),
  zoneId: z.string().optional(),
});

export const ZoneConfigSchema = z.object({
  zoneId: z.string().min(1, "Zone ID is required"),
  domain: z.string().min(1, "Domain is required"),
  ip: z.string().optional(),
});

// ============================================================================
// DNS Record Schemas
// ============================================================================

export const DNSRecordSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  content: z.string().min(1),
  ttl: z.number().positive().optional(),
  proxied: z.boolean().optional(),
  priority: z.number().optional(),
});

export const DNSRecordResultSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  content: z.string(),
  proxied: z.boolean(),
  ttl: z.number(),
  created_on: z.string(),
  modified_on: z.string(),
});

// ============================================================================
// Custom Hostname Schemas (SSL for SaaS)
// ============================================================================

export const SslValidationRecordSchema = z.object({
  txt_name: z.string().optional(),
  txt_value: z.string().optional(),
  http_url: z.string().optional(),
  http_body: z.string().optional(),
  cname_target: z.string().optional(),
  cname_name: z.string().optional(),
});

export const CustomHostnamePayloadSchema = z.object({
  hostname: z.string().min(1),
  ssl: z.object({
    method: z.string(),
    type: z.string(),
    settings: z.object({
      http2: z.string(),
      min_tls_version: z.string(),
      tls_1_3: z.string(),
    }),
  }),
  custom_origin_sni: z.string().optional(),
});

export const CustomHostnameResultSchema = z.object({
  id: z.string(),
  hostname: z.string(),
  ssl: z.object({
    status: z.string(),
    method: z.string(),
    type: z.string(),
    validation_records: z.array(SslValidationRecordSchema).optional(),
    settings: z.object({
      http2: z.string(),
      min_tls_version: z.string(),
      tls_1_3: z.string(),
    }),
  }),
  status: z.string(),
  verification_errors: z.array(z.string()).optional(),
  ownership_verification: z
    .object({
      type: z.string(),
      name: z.string(),
      value: z.string(),
    })
    .optional(),
  custom_origin_sni: z.string().optional(),
});

// ============================================================================
// Cloudflare API Response Schemas
// ============================================================================

export const CloudflareAPIResponseSchema = z.object({
  success: z.boolean(),
  errors: z.array(
    z.object({
      code: z.number(),
      message: z.string(),
    })
  ),
  messages: z.array(z.string()),
  result: z.any(),
});

// ============================================================================
// Verification Status Schemas
// ============================================================================

export const VerificationStatusResultSchema = z.object({
  message: z.string(),
  shouldUpdateVerified: z.boolean(),
  shouldUpdateActive: z.boolean(),
  isFullyActive: z.boolean(),
  nextStep: SslValidationRecordSchema.nullable(),
});

export const StatusUpdateDataSchema = z.object({
  status: z.nativeEnum(DomainStatus),
  sslStatus: z.nativeEnum(SslStatus),
  lastVerifiedAt: z.date(),
});

// ============================================================================
// Operation Result Schemas
// ============================================================================

export const CreateRecordResultSchema = z.object({
  success: z.boolean(),
  record: DNSRecordResultSchema,
});

export const DeleteRecordResultSchema = z.object({
  success: z.boolean(),
  recordId: z.string(),
});

export const CreateCustomHostnameResultSchema = z.object({
  success: z.boolean(),
  hostname: CustomHostnameResultSchema,
});

export const DeleteCustomHostnameResultSchema = z.object({
  success: z.boolean(),
  customHostnameId: z.string(),
});

// ============================================================================
// Zone Query Schemas
// ============================================================================

export const ZoneListResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  paused: z.boolean(),
  type: z.string(),
  development_mode: z.number(),
});

// ============================================================================
// Type Definitions (z.infer)
// ============================================================================

// Configuration Types
export type CloudflareConfig = z.infer<typeof CloudflareConfigSchema>;
export type ZoneConfig = z.infer<typeof ZoneConfigSchema>;

// DNS Record Types
export type DNSRecord = z.infer<typeof DNSRecordSchema>;
export type DNSRecordResult = z.infer<typeof DNSRecordResultSchema>;

// Custom Hostname Types
export type SslValidationRecord = z.infer<typeof SslValidationRecordSchema>;
export type CustomHostnamePayload = z.infer<typeof CustomHostnamePayloadSchema>;
export type CustomHostnameResult = z.infer<typeof CustomHostnameResultSchema>;

// Cloudflare API Response Type
export type CloudflareAPIResponse<T = any> = {
  success: boolean;
  errors: Array<{
    code: number;
    message: string;
  }>;
  messages: string[];
  result: T;
};

// Verification Status Types
export type VerificationStatusResult = z.infer<
  typeof VerificationStatusResultSchema
>;
export type StatusUpdateData = z.infer<typeof StatusUpdateDataSchema>;

// Status Enums
export type CloudflareHostnameStatus =
  | "active"
  | "pending"
  | "moved"
  | "deleted"
  | string;
export type CloudflareSslStatus =
  | "active"
  | "pending_validation"
  | "pending_issuance"
  | "pending_deployment"
  | string;

// Operation Result Types
export type CreateRecordResult = z.infer<typeof CreateRecordResultSchema>;
export type DeleteRecordResult = z.infer<typeof DeleteRecordResultSchema>;
export type CreateCustomHostnameResult = z.infer<
  typeof CreateCustomHostnameResultSchema
>;
export type DeleteCustomHostnameResult = z.infer<
  typeof DeleteCustomHostnameResultSchema
>;

// Zone Query Types
export type ZoneListResult = z.infer<typeof ZoneListResultSchema>;
