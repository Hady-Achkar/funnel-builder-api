import { z } from "zod";

export const getAllCategoriesQuery = z.object({
  search: z.string().trim().optional(),
});

export type GetAllCategoriesQuery = z.infer<typeof getAllCategoriesQuery>;

export const categorySummaryItem = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  templateCount: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CategorySummaryItem = z.infer<typeof categorySummaryItem>;

export const getAllCategoriesResponse = z.object({
  categories: z.array(categorySummaryItem),
});

export type GetAllCategoriesResponse = z.infer<typeof getAllCategoriesResponse>;
