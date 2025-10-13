import { z } from "zod";

// Webhook event types
export enum WebhookEventType {
  CHARGE_SUCCEEDED = "charge.succeeded",
  CHARGE_FAILED = "charge.failed",
  CHARGE_REFUND_INITIATED = "charge.refund_initiated",
  CHARGE_REFUNDED = "charge.refunded",
  CHARGE_REFUND_FAILED = "charge.refund_failed",
  CHARGE_CARD_VERIFIED = "charge.card_verified",
}

// Payment details from webhook
export const WebhookPaymentDetails = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  planType: z.string(), // BUSINESS, AGENCY, etc.
  frequency: z.string(), // monthly, annually
  paymentType: z.string(), // WORKSPACE_PURCHASE, PLAN_PURCHASE, ADD_ONS
  trialDays: z.number().optional(),
  trialEndDate: z.string().optional(),
  frequencyInterval: z.number().optional(),
});

// Affiliate link data (optional)
export const WebhookAffiliateLink = z.object({
  id: z.number(),
  token: z.string(),
  userId: z.number(),
  itemType: z.string(),
  commissionPercentage: z.number(),
  settings: z.any().optional(),
  affiliateLinkId: z.number().optional(),
});

// Customer details
export const WebhookCustomerDetails = z.object({
  name: z.string(),
  email: z.string().email(),
  phone_number: z.string(),
  comment: z.string().optional(),
});

// Payment method details
export const WebhookPaymentMethod = z.object({
  card_id: z.string().nullable().optional(),
  type: z.string(),
  card_holder_name: z.string(),
  card_last4: z.string(),
  card_expiry_month: z.string(),
  card_expiry_year: z.string(),
  origin: z.string(),
});

// Main webhook request schema
export const PaymentWebhookRequest = z.object({
  // Required fields for validation
  status: z.string(),
  id: z.string(), // Transaction ID like "PAY-D94C59891E"
  event_type: z.string(),

  // Payment details
  amount: z.number(),
  amount_currency: z.string(),
  refund_amount: z.number().optional(),
  refund_status: z.string().optional(),

  // Custom data with details and optional affiliate link
  custom_data: z.object({
    details: WebhookPaymentDetails,
    affiliateLink: WebhookAffiliateLink.optional(),
  }),

  // Additional fields
  created_date: z.string(),
  subscription_id: z.string().nullable().optional(),
  settlement_amount: z.string().optional(),
  settlement_currency: z.string().optional(),
  settlement_date: z.string().optional(),
  customer_details: WebhookCustomerDetails,
  payment_method: WebhookPaymentMethod,
  settlement_fee: z.string().optional(),
  settlement_vat: z.string().optional(),
  payment_link_id: z.string().optional(),
  payment_link_url: z.string().optional(),
  external_id: z.string().nullable().optional(),
  billing_descriptor: z.string().optional(),
  error_code: z.string().nullable().optional(),
  error_message: z.string().nullable().optional(),
  next_payment_date: z.string().nullable().optional(),
});

export type PaymentWebhookRequest = z.infer<typeof PaymentWebhookRequest>;
export type WebhookPaymentDetails = z.infer<typeof WebhookPaymentDetails>;
export type WebhookAffiliateLink = z.infer<typeof WebhookAffiliateLink>;

// Webhook response types
export interface WebhookResponse {
  received: boolean;
  ignored?: boolean;
  message?: string;
  reason?: string;
}