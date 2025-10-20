export interface RenewalWebhookResponse {
  received: boolean;
  ignored?: boolean;
  message?: string;
  reason?: string;
  data?: {
    userId?: number;
    paymentId?: number;
    subscriptionId?: number;
    addonId?: number;
  };
}
