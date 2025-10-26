import { z } from "zod";
import {
  DomainType,
  DomainStatus,
  SslStatus,
} from "../../../generated/prisma-client";

// Request schema
export const CreateSubdomainRequestSchema = z.object({
  subdomain: z
    .string()
    .min(1, "Subdomain is required")
    .max(63, "Subdomain cannot exceed 63 characters")
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, {
      message:
        "Subdomain can only contain lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.",
    })
    .refine((val) => !val.includes("--"), {
      message: "Subdomain cannot contain consecutive hyphens",
    }),
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
});

export type CreateSubdomainRequest = z.infer<typeof CreateSubdomainRequestSchema>;

// Subdomain data schema
export const SubdomainDataSchema = z.object({
  id: z.number({ message: "Domain ID must be a number" }),
  hostname: z.string({ message: "Hostname must be a string" }),
  type: z.enum(DomainType, {
    message: `Domain type must be one of: ${Object.values(DomainType).join(
      ", "
    )}`,
  }),
  status: z.enum(DomainStatus, {
    message: `Domain status must be one of: ${Object.values(DomainStatus).join(
      ", "
    )}`,
  }),
  sslStatus: z.enum(SslStatus, {
    message: `SSL status must be one of: ${Object.values(SslStatus).join(
      ", "
    )}`,
  }),
  isVerified: z.boolean({ message: "Is verified must be a boolean" }),
  isActive: z.boolean({ message: "Is active must be a boolean" }),
  azureCustomDomainName: z.string().nullable(),
  createdAt: z.date({ message: "Created at must be a date" }),
  updatedAt: z.date({ message: "Updated at must be a date" }),
});

export type SubdomainData = z.infer<typeof SubdomainDataSchema>;

// Response schema
export const CreateSubdomainResponseSchema = z.object({
  message: z.string({ message: "Message must be a string" }),
  domain: SubdomainDataSchema,
});

export type CreateSubdomainResponse = z.infer<typeof CreateSubdomainResponseSchema>;

// Backward compatibility exports
export const createSubdomainRequest = CreateSubdomainRequestSchema;
export const subdomainData = SubdomainDataSchema;
export const createSubdomainResponse = CreateSubdomainResponseSchema;
