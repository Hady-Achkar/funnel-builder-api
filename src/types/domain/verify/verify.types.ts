import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const VerifyDomainRequestSchema = z.object({
  id: z
    .number({
      message: "Domain ID must be a valid number",
    })
    .int({ message: "Domain ID must be an integer" })
    .positive({ message: "Domain ID must be positive" }),
});

export type VerifyDomainRequest = z.infer<typeof VerifyDomainRequestSchema>;

export const CloudFlareSslStatusSchema = z.enum([
  "initializing",
  "pending_validation",
  "active",
  "failed",
  "expired",
]);

export type CloudFlareSslStatus = z.infer<typeof CloudFlareSslStatusSchema>;

export const CloudFlareHostnameStatusSchema = z.enum([
  "pending",
  "active",
  "moved",
  "blocked",
]);

export type CloudFlareHostnameStatus = z.infer<
  typeof CloudFlareHostnameStatusSchema
>;

export const SslValidationRecordSchema = z.object({
  txt_name: z.string().optional(),
  txt_value: z.string().optional(),
  http_url: z.string().optional(),
  http_body: z.string().optional(),
  cname_target: z.string().optional(),
  cname_name: z.string().optional(),
});

export type SslValidationRecord = z.infer<typeof SslValidationRecordSchema>;

export const DomainVerificationStatusSchema = z.object({
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
  overallStatus: z.string().nullable(),
  createdAt: z.date({ message: "Created at must be a date" }),
  updatedAt: z.date({ message: "Updated at must be a date" }),
});

export type DomainVerificationStatus = z.infer<
  typeof DomainVerificationStatusSchema
>;

export const VerifyDomainResponseSchema = z.object({
  message: z.string(),
  domain: DomainVerificationStatusSchema,
  isFullyActive: z.boolean(),
  nextStep: SslValidationRecordSchema.nullable(),
});

export type VerifyDomainResponse = z.infer<typeof VerifyDomainResponseSchema>;
