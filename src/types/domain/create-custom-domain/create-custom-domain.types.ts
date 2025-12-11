import { z } from "zod";
import { HostnameSchema } from "../shared";
import { $Enums } from "../../../generated/prisma-client";

export const CreateCustomDomainRequestSchema = z.object({
  hostname: HostnameSchema,
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
});

export type CreateCustomDomainRequest = z.infer<
  typeof CreateCustomDomainRequestSchema
>;

export const DNSSetupRecordSchema = z.object({
  type: z.enum(["TXT", "CNAME"], {
    message: "DNS record type must be either TXT or CNAME",
  }),
  name: z.string({
    message: "DNS record name must be a string",
  }),
  value: z.string({
    message: "DNS record value must be a string",
  }),
  purpose: z.string({
    message: "DNS record purpose must be a string",
  }),
});

export type DNSSetupRecord = z.infer<typeof DNSSetupRecordSchema>;

export const SetupInstructionsSchema = z.object({
  records: z.array(DNSSetupRecordSchema),
});

export type SetupInstructions = z.infer<typeof SetupInstructionsSchema>;

export const CreatedDomainSchema = z.object({
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
  verificationToken: z.string().nullable(),
  customHostnameId: z.string().nullable(),
  ownershipVerification: z.any().nullable(),
  cnameVerificationInstructions: z.any().nullable(),
  createdAt: z.date({ message: "Created at must be a date" }),
  updatedAt: z.date({ message: "Updated at must be a date" }),
});

export type CreatedDomain = z.infer<typeof CreatedDomainSchema>;

export const CreateCustomDomainResponseSchema = z.object({
  message: z.string({ message: "Message must be a string" }),
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
