import { z } from "zod";

export const searchTemplatesQuery = z.object({
  search: z.string().trim().optional(),
});

export type SearchTemplatesQuery = z.infer<typeof searchTemplatesQuery>;

export const searchTemplateItem = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
});

export type SearchTemplateItem = z.infer<typeof searchTemplateItem>;

export const searchTemplatesResponse = z.object({
  templates: z.array(searchTemplateItem),
});

export type SearchTemplatesResponse = z.infer<typeof searchTemplatesResponse>;
