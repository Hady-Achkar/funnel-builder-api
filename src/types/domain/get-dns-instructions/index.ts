import { z } from "zod";
import { DomainType, DomainStatus, SslStatus } from "../../../generated/prisma-client";

export const GetDNSInstructionsRequestSchema = z.object({
  id: z.number().int().positive(),
});

export type GetDNSInstructionsRequest = z.infer<typeof GetDNSInstructionsRequestSchema>;

export const DNSRecordSchema = z.object({
  type: z.enum(["TXT", "CNAME", "A"]),
  name: z.string(),
  value: z.string(),
  purpose: z.string(),
  status: z.enum(["pending", "active", "verified", "failed"]),
  required: z.boolean(),
});

export const DNSRecordsGroupSchema = z.object({
  ownership: DNSRecordSchema.optional(),
  traffic: DNSRecordSchema.optional(),
  ssl: z.array(DNSRecordSchema).optional(),
});

export const ProgressSchema = z.object({
  percentage: z.number(),
  nextStep: z.string().optional(),
});

export const DomainInfoSchema = z.object({
  id: z.number(),
  hostname: z.string(),
  type: z.nativeEnum(DomainType),
  status: z.nativeEnum(DomainStatus),
  sslStatus: z.nativeEnum(SslStatus),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

export const GetDNSInstructionsResponseSchema = z.object({
  domain: DomainInfoSchema,
  dnsRecords: z.union([DNSRecordsGroupSchema, z.array(z.never())]),
  instructions: z.string(),
  totalRecords: z.number(),
  completedRecords: z.number(),
  progress: z.union([ProgressSchema, z.number()]),
});

export type GetDNSInstructionsResponse = z.infer<typeof GetDNSInstructionsResponseSchema>;

export type DNSRecords = z.infer<typeof DNSRecordsGroupSchema>;
export type DNSRecordStatus = "pending" | "active" | "verified" | "failed";
