import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const subscriptionWebhookRequest = z.object({
  event_type: z.literal("charge.succeeded"),
  status: z.string(),
  id: z.string(),
  amount: z.number(),
  amount_currency: z.string(),
  custom_data: z.object({
    details: z.object({
      email: z.string().email(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      planType: z.nativeEnum($Enums.UserPlan),
      frequency: z.enum(["weekly", "monthly", "annually"]),
      frequencyInterval: z.number().min(1),
      admins: z.number().optional().default(1),
      funnels: z.number().optional().default(10),
      subdomains: z.number().optional().default(10),
      customDomains: z.number().optional().default(1),
      trialDays: z.number().optional().default(0),
      trialEndDate: z.string().optional(),
    }),
    affiliateLink: z.object({
      id: z.number(),
      token: z.string(),
      userId: z.number(),
      itemType: z.nativeEnum($Enums.UserPlan),
      affiliateAmount: z.number().optional(), // Will be added later
    }).optional(),
  }),
  created_date: z.string(),
  subscription_id: z.string().nullable(),
  customer_details: z.object({
    name: z.string(),
    email: z.string().email(),
    phone_number: z.string().optional(),
    comment: z.string().optional(),
  }),
  payment_method: z.object({
    type: z.string(),
    card_holder_name: z.string().optional(),
    card_last4: z.string().optional(),
  }).passthrough(), // Allow other payment method fields
}).passthrough(); // Allow other webhook fields

export type SubscriptionWebhookRequest = z.infer<typeof subscriptionWebhookRequest>;

export interface SubscriptionCreateResponse {
  received: boolean;
  ignored?: boolean;
  message?: string;
  userId?: number;
  subscriptionId?: number;
  paymentId?: number;
}

export interface SubscriptionCreateError {
  error: string;
  details?: string;
  stage?: "validation" | "duplicate_check" | "user_creation" | "payment_creation" | "subscription_creation" | "email_sending" | "affiliate_processing";
}