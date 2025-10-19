import { z } from "zod";

// Request schema
export const cancelSubscriptionRequestSchema = z.object({
  subscriptionId: z.string().min(1, "Subscription ID is required"),
});

// Response schema
export const cancelSubscriptionResponseSchema = z.object({
  message: z.string(),
  subscriptionId: z.string(),
  endsAt: z.date(),
  status: z.string(),
  itemType: z.string(),
  addonType: z.string().nullable().optional(),
  subscriptionType: z.string().nullable().optional(),
});

// Inferred types
export type CancelSubscriptionRequest = z.infer<
  typeof cancelSubscriptionRequestSchema
>;
export type CancelSubscriptionResponse = z.infer<
  typeof cancelSubscriptionResponseSchema
>;

// Export for backward compatibility
export const cancelSubscriptionRequest = cancelSubscriptionRequestSchema;
export const cancelSubscriptionResponse = cancelSubscriptionResponseSchema;
