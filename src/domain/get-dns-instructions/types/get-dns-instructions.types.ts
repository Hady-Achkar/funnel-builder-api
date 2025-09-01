import { z } from "zod";

export const GetDNSInstructionsRequestSchema = z.object({
  id: z.number().int().positive(),
});

export type GetDNSInstructionsRequest = z.infer<
  typeof GetDNSInstructionsRequestSchema
>;

export const DNSRecordStatusSchema = z.enum([
  "pending",
  "verified",
  "active",
  "failed",
]);

export type DNSRecordStatus = z.infer<typeof DNSRecordStatusSchema>;

export const DNSRecordInstructionSchema = z.object({
  type: z.enum(["TXT", "CNAME", "A"]),
  name: z.string(),
  value: z.string(),
  purpose: z.string(),
  status: DNSRecordStatusSchema,
  required: z.boolean(),
});

export type DNSRecordInstruction = z.infer<typeof DNSRecordInstructionSchema>;

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

export const DNSRecordsSchema = z.object({
  ownership: DNSRecordInstructionSchema.optional(),
  traffic: DNSRecordInstructionSchema.optional(),
  ssl: z.array(DNSRecordInstructionSchema).optional(),
});

export type DNSRecords = z.infer<typeof DNSRecordsSchema>;

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

export type GetDNSInstructionsResponse = z.infer<
  typeof GetDNSInstructionsResponseSchema
>;
