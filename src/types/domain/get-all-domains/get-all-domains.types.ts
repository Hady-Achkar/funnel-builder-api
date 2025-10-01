import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const GetAllDomainsRequestSchema = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
  page: z
    .number({
      message: "Page must be a number",
    })
    .int({ message: "Page must be an integer" })
    .positive({ message: "Page must be positive" })
    .optional()
    .default(1),
  limit: z
    .number({
      message: "Limit must be a number",
    })
    .int({ message: "Limit must be an integer" })
    .positive({ message: "Limit must be positive" })
    .max(100, { message: "Limit cannot exceed 100" })
    .optional()
    .default(10),
  filters: z
    .object({
      status: z
        .enum($Enums.DomainStatus, {
          message: `Status must be one of: ${Object.values(
            $Enums.DomainStatus
          ).join(", ")}`,
        })
        .optional(),
      type: z
        .enum($Enums.DomainType, {
          message: `Type must be one of: ${Object.values(
            $Enums.DomainType
          ).join(", ")}`,
        })
        .optional(),
      hostname: z
        .string({
          message: "Hostname must be a string",
        })
        .min(1, { message: "Hostname cannot be empty" })
        .optional(),
    })
    .optional()
    .default({}),
  search: z
    .string({
      message: "Search must be a string",
    })
    .min(1, { message: "Search cannot be empty" })
    .optional(),
  sortBy: z
    .enum(["createdAt", "hostname", "status"], {
      message: "Sort by must be one of: createdAt, hostname, status",
    })
    .optional()
    .default("createdAt"),
  sortOrder: z
    .enum(["asc", "desc"], {
      message: "Sort order must be either 'asc' or 'desc'",
    })
    .optional()
    .default("desc"),
});

export type GetAllDomainsRequest = z.infer<typeof GetAllDomainsRequestSchema>;

export const DomainSummarySchema = z.object({
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
  workspaceId: z.number({ message: "Workspace ID must be a number" }),
});

export type DomainSummary = z.infer<typeof DomainSummarySchema>;

export const PaginationSchema = z.object({
  page: z.number({ message: "Page must be a number" }),
  limit: z.number({ message: "Limit must be a number" }),
  total: z.number({ message: "Total must be a number" }),
  totalPages: z.number({ message: "Total pages must be a number" }),
  hasNext: z.boolean({ message: "Has next must be a boolean" }),
  hasPrev: z.boolean({ message: "Has previous must be a boolean" }),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const GetAllDomainsResponseSchema = z.object({
  domains: z.array(DomainSummarySchema, {
    message: "Domains must be an array",
  }),
  pagination: PaginationSchema,
  filters: z.object({
    status: z.enum($Enums.DomainStatus).optional(),
    type: z.enum($Enums.DomainType).optional(),
    hostname: z.string().optional(),
  }),
});

export type GetAllDomainsResponse = z.infer<typeof GetAllDomainsResponseSchema>;
