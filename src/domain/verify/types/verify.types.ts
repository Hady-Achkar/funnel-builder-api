import { z } from "zod";

export const VerifyDomainRequestSchema = z.object({
  id: z.number().int().positive(),
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
  id: z.number(),
  hostname: z.string(),
  type: z.string(),
  status: z.string(),
  sslStatus: z.string().nullable(),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  verificationToken: z.string().nullable(),
  customHostnameId: z.string().nullable(),
  overallStatus: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
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
