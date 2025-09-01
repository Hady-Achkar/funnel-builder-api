import { z } from "zod";
import { HostnameSchema } from "../../shared/types";

export const CreateCustomDomainRequestSchema = z.object({
  hostname: HostnameSchema,
  workspaceId: z.number().int().positive(),
});

export type CreateCustomDomainRequest = z.infer<
  typeof CreateCustomDomainRequestSchema
>;

export const DNSSetupRecordSchema = z.object({
  type: z.enum(["TXT", "CNAME"]),
  name: z.string(),
  value: z.string(),
  purpose: z.string(),
});

export type DNSSetupRecord = z.infer<typeof DNSSetupRecordSchema>;

export const SetupInstructionsSchema = z.object({
  records: z.array(DNSSetupRecordSchema),
});

export type SetupInstructions = z.infer<typeof SetupInstructionsSchema>;

export const CreatedDomainSchema = z.object({
  id: z.number(),
  hostname: z.string(),
  type: z.string(),
  status: z.string(),
  sslStatus: z.string().nullable(),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  verificationToken: z.string().nullable(),
  customHostnameId: z.string().nullable(),
  ownershipVerification: z.any().nullable(),
  cnameVerificationInstructions: z.any().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreatedDomain = z.infer<typeof CreatedDomainSchema>;

export const CreateCustomDomainResponseSchema = z.object({
  message: z.string(),
  domain: CreatedDomainSchema,
  setupInstructions: SetupInstructionsSchema,
});

export type CreateCustomDomainResponse = z.infer<
  typeof CreateCustomDomainResponseSchema
>;

export const UserDomainLimitsSchema = z.object({
  userId: z.number(),
  maxCustomDomainsAllowed: z.number(),
  currentCustomDomainCount: z.number(),
});

export type UserDomainLimits = z.infer<typeof UserDomainLimitsSchema>;
