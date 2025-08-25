import { z } from "zod";

export const pageOrderItem = z.object({
  id: z.number().positive("Page ID must be a positive number"),
  order: z.number().positive("Order must be a positive number"),
});

export const reorderPagesRequest = z.object({
  funnelId: z.number().positive("Funnel ID must be a positive number"),
  pageOrders: z.array(pageOrderItem).min(1, "At least one page order must be provided"),
});

export const reorderPagesResponse = z.object({
  message: z.string(),
});

export type PageOrderItem = z.infer<typeof pageOrderItem>;
export type ReorderPagesRequest = z.infer<typeof reorderPagesRequest>;
export type ReorderPagesResponse = z.infer<typeof reorderPagesResponse>;