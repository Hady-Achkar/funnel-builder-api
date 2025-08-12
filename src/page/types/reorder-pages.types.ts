import { z } from "zod";

export const ReorderPagesParamsSchema = z.object({
  funnelId: z.coerce
    .number({ message: "Funnel ID must be a number" })
    .int({ message: "Funnel ID must be an integer" })
    .positive({ message: "Funnel ID must be positive" }),
});

export const PageOrderSchema = z.object({
  id: z
    .number({ message: "Page ID must be a number" })
    .int({ message: "Page ID must be an integer" })
    .positive({ message: "Page ID must be positive" }),
  order: z
    .number({ message: "Order must be a number" })
    .int({ message: "Order must be an integer" })
    .positive({ message: "Order must be positive" }),
});

export const ReorderPagesBodySchema = z.object({
  pageOrders: z
    .array(PageOrderSchema, { message: "Page orders must be an array" })
    .min(2, { message: "At least two page orders are required" }),
});

export const ReorderPagesResponseSchema = z.object({
  message: z
    .string({ message: "Message is required" })
    .min(1, "Message cannot be empty"),
});

export type ReorderPagesParams = z.infer<typeof ReorderPagesParamsSchema>;
export type PageOrder = z.infer<typeof PageOrderSchema>;
export type ReorderPagesBody = z.infer<typeof ReorderPagesBodySchema>;
export type ReorderPagesResponse = z.infer<typeof ReorderPagesResponseSchema>;
