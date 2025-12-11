import { z } from "zod";

export const getAllInsightSubmissionsRequest = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
  funnelSlug: z.string().min(1, "Funnel slug is required"),
  // Filter options (all optional)
  type: z.enum(["QUIZ", "SINGLE_CHOICE", "MULTIPLE_CHOICE"]).optional(),
  insightId: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      if (isNaN(num)) {
        throw new Error("Insight ID must be a valid number");
      }
      return num;
    })
    .refine((val) => val > 0, {
      message: "Insight ID must be a positive number",
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

export type GetAllInsightSubmissionsRequest = z.infer<typeof getAllInsightSubmissionsRequest>;

export const insightSubmissionData = z.object({
  id: z.number(),
  insightId: z.number(),
  insightName: z.string(),
  insightType: z.enum(["QUIZ", "SINGLE_CHOICE", "MULTIPLE_CHOICE"]),
  sessionId: z.string(),
  answers: z.any().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  answerCount: z.number(), // Number of unique sessions that answered this insight
  totalSessions: z.number(), // Total number of unique sessions in the funnel
});

export type InsightSubmissionData = z.infer<typeof insightSubmissionData>;

export const getAllInsightSubmissionsResponse = z.object({
  submissions: z.array(insightSubmissionData),
  funnelName: z.string(),
  pagination: z.object({
    total: z.number(),
    totalPages: z.number(),
    currentPage: z.number(),
    limit: z.number(),
  }),
  filters: z.object({
    type: z.enum(["QUIZ", "SINGLE_CHOICE", "MULTIPLE_CHOICE"]).optional(),
    insightId: z.number().optional(),
    sessionId: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    completedOnly: z.boolean().optional(),
    sortBy: z.enum(["createdAt", "updatedAt"]),
    sortOrder: z.enum(["asc", "desc"]),
  }),
});

export type GetAllInsightSubmissionsResponse = z.infer<typeof getAllInsightSubmissionsResponse>;