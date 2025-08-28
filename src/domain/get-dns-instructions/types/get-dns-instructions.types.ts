import { z } from "zod";

// Request Schema - can get by ID or hostname
export const GetDNSInstructionsRequestSchema = z.object({
  id: z.number().int().positive().optional(),
  hostname: z.string().optional(),
}).refine((data) => data.id || data.hostname, {
  message: "Either id or hostname must be provided",
});

export type GetDNSInstructionsRequest = z.infer<typeof GetDNSInstructionsRequestSchema>;

// DNS Record Status Schema
export const DNSRecordStatusSchema = z.enum([
  "pending",
  "verified", 
  "active",
  "failed"
]);

export type DNSRecordStatus = z.infer<typeof DNSRecordStatusSchema>;

// Individual DNS Record Schema
export const DNSRecordInstructionSchema = z.object({
  type: z.enum(["TXT", "CNAME", "A"]),
  name: z.string(),
  value: z.string(),
  purpose: z.string(),
  status: DNSRecordStatusSchema,
  required: z.boolean(),
});

export type DNSRecordInstruction = z.infer<typeof DNSRecordInstructionSchema>;

// Domain Summary Schema
export const DomainSummarySchema = z.object({
  id: z.number(),
  hostname: z.string(),
  type: z.string(),
  status: z.string(),
  sslStatus: z.string().nullable(),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

export type DomainSummary = z.infer<typeof DomainSummarySchema>;

// Complete DNS Records Schema
export const DNSRecordsSchema = z.object({
  ownership: DNSRecordInstructionSchema.optional(),
  traffic: DNSRecordInstructionSchema.optional(),
  ssl: z.array(DNSRecordInstructionSchema).optional(),
});

export type DNSRecords = z.infer<typeof DNSRecordsSchema>;

// Get DNS Instructions Response Schema
export const GetDNSInstructionsResponseSchema = z.object({
  domain: DomainSummarySchema,
  dnsRecords: DNSRecordsSchema,
  instructions: z.string(),
  totalRecords: z.number(),
  completedRecords: z.number(),
  progress: z.object({
    percentage: z.number(),
    nextStep: z.string().optional(),
  }),
});

export type GetDNSInstructionsResponse = z.infer<typeof GetDNSInstructionsResponseSchema>;