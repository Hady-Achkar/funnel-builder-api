import { z } from "zod";
import {
  DomainStatus,
  DomainType,
  SslStatus,
} from "../../../generated/prisma-client";

export const CreateDomainDataSchema = z.object({
  hostname: z.string(),
  type: z.enum([DomainType.CUSTOM_DOMAIN, DomainType.SUBDOMAIN]),
});

export type CreateDomainData = z.infer<typeof CreateDomainDataSchema>;

export const CreateSubdomainDataSchema = z.object({
  subdomain: z.string(),
});

export type CreateSubdomainData = z.infer<typeof CreateSubdomainDataSchema>;

export const FunnelConnectionSchema = z.object({
  id: z.number(),
  funnelId: z.number(),
  isActive: z.boolean(),
  funnel: z.object({
    id: z.number(),
    name: z.string(),
    status: z.string(),
  }),
});

export type FunnelConnection = z.infer<typeof FunnelConnectionSchema>;

export const DomainWithConnectionsSchema = z.object({
  id: z.number(),
  hostname: z.string(),
  type: z.enum([DomainType.CUSTOM_DOMAIN, DomainType.SUBDOMAIN]),
  status: z.enum([DomainStatus.PENDING, DomainStatus.VERIFIED, DomainStatus.ACTIVE, DomainStatus.FAILED, DomainStatus.SUSPENDED]),
  sslStatus: z.enum([SslStatus.PENDING, SslStatus.ACTIVE, SslStatus.ERROR, SslStatus.EXPIRED]),
  workspaceId: z.number(),
  createdBy: z.number(),
  cloudflareHostnameId: z.string().nullable(),
  cloudflareZoneId: z.string().nullable(),
  cloudflareRecordId: z.string().nullable(),
  verificationToken: z.string().nullable(),
  ownershipVerification: z.any().nullable(),
  dnsInstructions: z.any().nullable(),
  sslValidationRecords: z.any().nullable(),
  lastVerifiedAt: z.date().nullable(),
  funnelConnections: z.array(FunnelConnectionSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DomainWithConnections = z.infer<typeof DomainWithConnectionsSchema>;

export const VerificationRecordSchema = z.object({
  type: z.string(),
  name: z.string(),
  value: z.string(),
  purpose: z.string(),
});

export type VerificationRecord = z.infer<typeof VerificationRecordSchema>;

export const VerificationInstructionsSchema = z.object({
  ownershipVerification: VerificationRecordSchema.optional(),
  dnsInstructions: VerificationRecordSchema.optional(),
});

export type VerificationInstructions = z.infer<
  typeof VerificationInstructionsSchema
>;

export const DomainConfigSchema = z.object({
  baseDomain: z.string(),
  zoneId: z.string(),
  targetIp: z.string(),
});

export type DomainConfig = z.infer<typeof DomainConfigSchema>;
