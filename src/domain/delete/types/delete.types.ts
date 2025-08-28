import { z } from "zod";

export const deleteDomainRequest = z.object({
  id: z.number().int().positive().optional(),
  hostname: z.string().min(1).optional(),
}).refine(
  (data) => data.id !== undefined || data.hostname !== undefined,
  {
    message: "Either 'id' or 'hostname' must be provided",
    path: ["id", "hostname"]
  }
);

export type DeleteDomainRequest = z.infer<typeof deleteDomainRequest>;

export const deletionDetails = z.object({
  hostname: z.string(),
  customHostnameDeleted: z.boolean(),
  dnsRecordsDeleted: z.boolean(),
  cloudflareRecordId: z.string().nullable(),
  cloudflareHostnameId: z.string().nullable(),
});

export type DeletionDetails = z.infer<typeof deletionDetails>;

export const deleteDomainResponse = z.object({
  message: z.string(),
  details: deletionDetails,
});

export type DeleteDomainResponse = z.infer<typeof deleteDomainResponse>;