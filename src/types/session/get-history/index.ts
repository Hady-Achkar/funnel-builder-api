import { z } from "zod";

export const getSessionHistoryParams = z.object({
  funnelId: z
    .number()
    .int("Funnel ID must be an integer")
    .positive("Funnel ID must be a positive number"),
  search: z.string().optional(),
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
  sortBy: z.enum(["createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
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

export type GetSessionHistoryParams = z.infer<typeof getSessionHistoryParams>;

export const sessionHistoryData = z.object({
  id: z.string(),
  sessionId: z.string(),
  visitedPages: z.array(z.number()),
  interactions: z.any(), // JSON object containing all interactions
  isCompleted: z.boolean(), // true if has form submission, false otherwise
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SessionHistoryData = z.infer<typeof sessionHistoryData>;

export const getSessionHistoryResponse = z.object({
  sessions: z.array(sessionHistoryData),
  total: z.number(),
  completedSessions: z.number(), // Number of sessions with form submissions
  ctr: z.number(), // Conversion rate as integer percentage (0-100)
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type GetSessionHistoryResponse = z.infer<
  typeof getSessionHistoryResponse
>;
