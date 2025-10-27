import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

/**
 * Request schema for associating a domain with Azure Front Door route
 */
export const AssociateDomainRequestSchema = z.object({
  id: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      if (isNaN(num)) throw new Error("Domain ID must be a valid number");
      return num;
    })
    .refine((val) => val > 0, {
      message: "Domain ID must be a positive number",
    }),
  routeName: z
    .string()
    .min(1, "Route name cannot be empty")
    .optional()
    .default("default-route"),
});

export type AssociateDomainRequest = z.infer<
  typeof AssociateDomainRequestSchema
>;

/**
 * Azure association details returned in response
 */
export const AzureAssociationDetailsSchema = z.object({
  customDomainId: z.string(),
  customDomainName: z.string(),
  routeId: z.string(),
  routeName: z.string(),
  associatedAt: z.date(),
});

export type AzureAssociationDetails = z.infer<
  typeof AzureAssociationDetailsSchema
>;

/**
 * Domain info returned in response
 */
export const AssociatedDomainInfoSchema = z.object({
  id: z.number(),
  hostname: z.string(),
  type: z.nativeEnum($Enums.DomainType),
  status: z.nativeEnum($Enums.DomainStatus),
  sslStatus: z.nativeEnum($Enums.SslStatus),
  isAssociated: z.boolean(),
  azureCustomDomainName: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AssociatedDomainInfo = z.infer<typeof AssociatedDomainInfoSchema>;

/**
 * Response schema for associate domain endpoint
 */
export const AssociateDomainResponseSchema = z.object({
  message: z.string(),
  domain: AssociatedDomainInfoSchema,
  azureDetails: AzureAssociationDetailsSchema,
});

export type AssociateDomainResponse = z.infer<
  typeof AssociateDomainResponseSchema
>;
