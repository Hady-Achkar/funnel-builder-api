import { z } from "zod";

export const CloudFlareConfigSchema = z.object({
  cfApiToken: z.string().min(1, "CloudFlare API token is required"),
  cfAccountId: z.string().min(1, "CloudFlare Account ID is required"),
  cfVerificationDomain: z.string().optional(),
  cfDomain: z.string().min(1, "CloudFlare domain is required"),
  cfZoneId: z.string().min(1, "CloudFlare Zone ID is required"),
});

export type CloudFlareConfig = z.infer<typeof CloudFlareConfigSchema>;

export const DNSRecordSchema = z.object({
  type: z.string(),
  name: z.string(),
  content: z.string(),
  ttl: z.number().optional(),
  proxied: z.boolean().optional(),
});

export type DNSRecord = z.infer<typeof DNSRecordSchema>;

export const CloudFlareAPIResponseSchema = z.object({
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

export type CloudFlareAPIResponse = z.infer<typeof CloudFlareAPIResponseSchema>;

export const HostnameSchema = z
  .string()
  .min(1, "Hostname cannot be empty")
  .max(253, "Hostname exceeds maximum length of 253 characters")
  .transform((val) => val.trim().toLowerCase())
  .refine((val) => {
    const labels = val.split(".");
    return labels.length >= 2;
  }, "Hostname must have at least one subdomain and a TLD")
  .refine((val) => {
    const labels = val.split(".");
    const tld = labels[labels.length - 1];
    return /^[a-z]{2,}$/.test(tld);
  }, "Invalid TLD format")
  .refine((val) => {
    const labels = val.split(".");
    return labels.every((label) => {
      if (!label) return false;
      if (label.length > 63) return false;
      return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(label);
    });
  }, "Invalid domain label format. Labels must start and end with letter/number and contain only letters, numbers or hyphens");

export const SubdomainSchema = z
  .string()
  .min(1, "Subdomain cannot be empty")
  .max(63, "Subdomain exceeds maximum length of 63 characters")
  .transform((val) => val.trim().toLowerCase())
  .refine((val) => {
    return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(val);
  }, "Invalid subdomain format. Subdomains must start and end with letter/number and contain only letters, numbers or hyphens")
  .refine((val) => {
    const reservedNames = [
      "www",
      "mail",
      "admin",
      "api",
      "ftp",
      "smtp",
      "pop",
      "ns1",
      "ns2",
      "cpanel",
      "webmail",
    ];
    return !reservedNames.includes(val);
  }, "Reserved subdomain name cannot be used");

export const DomainPartsSchema = z.object({
  subdomain: z.string().optional(),
  domain: z.string(),
  tld: z.string(),
  rootDomain: z.string(),
});

export type DomainParts = z.infer<typeof DomainPartsSchema>;

export const DNSRecordTypeSchema = z.enum([
  "A",
  "AAAA",
  "CNAME",
  "TXT",
  "MX",
  "NS",
]);
export type DNSRecordType = z.infer<typeof DNSRecordTypeSchema>;

export const DNSResolutionResultSchema = z.object({
  hostname: z.string(),
  recordType: DNSRecordTypeSchema,
  records: z.array(z.string()),
  success: z.boolean(),
  error: z.string().optional(),
});

export type DNSResolutionResult = z.infer<typeof DNSResolutionResultSchema>;

export const CustomHostnamePayloadSchema = z.object({
  hostname: z.string(),
  ssl: z.object({
    method: z.string().default("http"),
    type: z.string().default("dv"),
    settings: z.object({
      http2: z.string().default("on"),
      min_tls_version: z.string().default("1.2"),
    }),
  }),
});

export type CustomHostnamePayload = z.infer<typeof CustomHostnamePayloadSchema>;
