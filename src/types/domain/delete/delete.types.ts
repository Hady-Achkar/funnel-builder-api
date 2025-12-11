import { z } from "zod";

export const deleteDomainRequest = z.object({
  id: z
    .number({
      message: "Domain ID must be a valid number",
    })
    .int({ message: "Domain ID must be an integer" })
    .positive({ message: "Domain ID must be positive" })
    .optional(),
  hostname: z
    .string({
      message: "Hostname must be a string",
    })
    .min(1, { message: "Hostname cannot be empty" })
    .optional(),
}).refine(
  (data) => data.id !== undefined || data.hostname !== undefined,
  {
    message: "Either 'id' or 'hostname' must be provided",
    path: ["id", "hostname"]
  }
);

export type DeleteDomainRequest = z.infer<typeof deleteDomainRequest>;

export const deletionDetails = z.object({
  hostname: z.string({ message: "Hostname must be a string" }),
  customHostnameDeleted: z.boolean({ message: "Custom hostname deleted must be a boolean" }),
  dnsRecordsDeleted: z.boolean({ message: "DNS records deleted must be a boolean" }),
  cloudflareRecordId: z.string().nullable(),
  cloudflareHostnameId: z.string().nullable(),
});

export type DeletionDetails = z.infer<typeof deletionDetails>;

export const deleteDomainResponse = z.object({
  message: z.string({ message: "Message must be a string" }),
  details: deletionDetails,
});

export type DeleteDomainResponse = z.infer<typeof deleteDomainResponse>;