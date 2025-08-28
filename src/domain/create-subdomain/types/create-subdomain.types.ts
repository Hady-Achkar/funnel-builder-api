import { z } from "zod";
import { DomainType, DomainStatus, SslStatus } from "../../../generated/prisma-client";

export const createSubdomainRequest = z.object({
  subdomain: z
    .string()
    .min(1, "Subdomain is required")
    .max(63, "Subdomain cannot exceed 63 characters")
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
      message: "Subdomain can only contain lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.",
    })
    .refine((val) => !val.includes("--"), {
      message: "Subdomain cannot contain consecutive hyphens",
    }),
});

export type CreateSubdomainRequest = z.infer<typeof createSubdomainRequest>;

export const subdomainData = z.object({
  id: z.number(),
  hostname: z.string(),
  type: z.nativeEnum(DomainType),
  status: z.nativeEnum(DomainStatus),
  sslStatus: z.nativeEnum(SslStatus),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  cloudflareRecordId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubdomainData = z.infer<typeof subdomainData>;

export const createSubdomainResponse = z.object({
  message: z.string(),
  domain: subdomainData,
});

export type CreateSubdomainResponse = z.infer<typeof createSubdomainResponse>;

export const userSubdomainLimits = z.object({
  userId: z.number(),
  maxSubdomainsAllowed: z.number().min(0),
  currentSubdomainCount: z.number().min(0),
});

export type UserSubdomainLimits = z.infer<typeof userSubdomainLimits>;