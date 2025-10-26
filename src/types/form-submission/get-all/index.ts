import { z } from "zod";

export const getAllFormSubmissionsRequest = z.object({
  funnelId: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      if (isNaN(num)) {
        throw new Error("Funnel ID must be a valid number");
      }
      return num;
    })
    .refine((val) => val > 0, {
      message: "Funnel ID must be a positive number",
    }),
  // Filter options (all optional)
  formId: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      if (isNaN(num)) {
        throw new Error("Form ID must be a valid number");
      }
      return num;
    })
    .refine((val) => val > 0, {
      message: "Form ID must be a positive number",
    })
    .optional(),
  sessionId: z.string().optional(),
  startDate: z
    .union([z.string(), z.date()])
    .transform((val) => {
      if (!val) return undefined;
      if (val instanceof Date) return val;
      return new Date(val);
    })
    .optional(),
  endDate: z
    .union([z.string(), z.date()])
    .transform((val) => {
      if (!val) return undefined;
      if (val instanceof Date) return val;
      return new Date(val);
    })
    .optional(),
  completedOnly: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === "string") {
        return val.toLowerCase() === "true";
      }
      return val;
    })
    .optional(),
  sortBy: z.enum(["createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  // Pagination
  page: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      if (isNaN(num) || num < 1) {
        return 1;
      }
      return num;
    })
    .default(1),
  limit: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      if (isNaN(num) || num < 1) {
        return 10;
      }
      if (num > 100) {
        return 100; // Max limit
      }
      return num;
    })
    .default(10),
});

export type GetAllFormSubmissionsRequest = z.infer<typeof getAllFormSubmissionsRequest>;

export const formSubmissionData = z.object({
  id: z.number(),
  formId: z.number(),
  formName: z.string(),
  sessionId: z.string(),
  submittedData: z.any().nullable(),
  isCompleted: z.boolean(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FormSubmissionData = z.infer<typeof formSubmissionData>;

export const getAllFormSubmissionsResponse = z.object({
  submissions: z.array(formSubmissionData),
  funnelName: z.string(),
  pagination: z.object({
    total: z.number(),
    totalPages: z.number(),
    currentPage: z.number(),
    limit: z.number(),
  }),
  filters: z.object({
    formId: z.number().optional(),
    sessionId: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    completedOnly: z.boolean().optional(),
    sortBy: z.enum(["createdAt", "updatedAt"]),
    sortOrder: z.enum(["asc", "desc"]),
  }),
});

export type GetAllFormSubmissionsResponse = z.infer<typeof getAllFormSubmissionsResponse>;