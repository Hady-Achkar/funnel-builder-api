import { z } from "zod";
import { DomainType } from "../../../generated/prisma-client";

export const DeleteDomainRequestSchema = z.object({
  id: z.number().int().positive(),
});

export type DeleteDomainRequest = z.infer<typeof DeleteDomainRequestSchema>;

export const DeleteDomainDetailsSchema = z.object({
  hostname: z.string(),
  azureDeleted: z.boolean(),
  type: z.nativeEnum(DomainType),
});

export type DeleteDomainDetails = z.infer<typeof DeleteDomainDetailsSchema>;

export const DeleteDomainResponseSchema = z.object({
  message: z.string(),
  details: DeleteDomainDetailsSchema,
});

export type DeleteDomainResponse = z.infer<typeof DeleteDomainResponseSchema>;

// Backward compatibility
export const deleteDomainResponse = DeleteDomainResponseSchema;
