import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const GetDNSInstructionsRequestSchema = z.object({
  id: z
    .number({
      message: "Domain ID must be a valid number",
    })
    .int({ message: "Domain ID must be an integer" })
    .positive({ message: "Domain ID must be positive" }),
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
  id: z.number({ message: "Domain ID must be a number" }),
  hostname: z.string({ message: "Hostname must be a string" }),
  type: z.enum($Enums.DomainType, {
    message: `Domain type must be one of: ${Object.values(
      $Enums.DomainType
    ).join(", ")}`,
  }),
  status: z.enum($Enums.DomainStatus, {
    message: `Domain status must be one of: ${Object.values(
      $Enums.DomainStatus
    ).join(", ")}`,
  }),
  sslStatus: z.enum($Enums.SslStatus).nullable(),
  isVerified: z.boolean({ message: "Is verified must be a boolean" }),
  isActive: z.boolean({ message: "Is active must be a boolean" }),
  createdAt: z.date({ message: "Created at must be a date" }),
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
