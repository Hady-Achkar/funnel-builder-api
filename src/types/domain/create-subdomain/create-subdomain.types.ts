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
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
});

export type CreateSubdomainRequest = z.infer<typeof createSubdomainRequest>;

export const subdomainData = z.object({
  id: z.number({ message: "Domain ID must be a number" }),
  hostname: z.string({ message: "Hostname must be a string" }),
  type: z.nativeEnum(DomainType, {
    message: `Domain type must be one of: ${Object.values(DomainType).join(", ")}`,
  }),
  status: z.nativeEnum(DomainStatus, {
    message: `Domain status must be one of: ${Object.values(DomainStatus).join(", ")}`,
  }),
  sslStatus: z.nativeEnum(SslStatus, {
    message: `SSL status must be one of: ${Object.values(SslStatus).join(", ")}`,
  }),
  isVerified: z.boolean({ message: "Is verified must be a boolean" }),
  isActive: z.boolean({ message: "Is active must be a boolean" }),
  cloudflareRecordId: z.string().nullable(),
  createdAt: z.date({ message: "Created at must be a date" }),
  updatedAt: z.date({ message: "Updated at must be a date" }),
});

export type SubdomainData = z.infer<typeof subdomainData>;

export const createSubdomainResponse = z.object({
  message: z.string({ message: "Message must be a string" }),
  domain: subdomainData,
});

export type CreateSubdomainResponse = z.infer<typeof createSubdomainResponse>;

