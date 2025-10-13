import { getPrisma } from "../../../lib/prisma";
import { ZodError } from "zod";
import {
  PaymentWebhookRequest,
  WebhookResponse,
  WebhookEventType,
} from "../../../types/subscription/webhook";

export class PaymentWebhookService {
  static async processWebhook(data: unknown): Promise<WebhookResponse> {
    try {
      const prisma = getPrisma();

      // 1. Early return if not an object
      if (typeof data !== "object" || data === null) {
        console.log("[Webhook] Invalid payload format - not an object");
        return {
          received: true,
          ignored: true,
          reason: "Invalid payload format",
        };
      }

      const rawData = data as any;

      // 2. Check event type - only process charge.succeeded
      if (rawData.event_type !== WebhookEventType.CHARGE_SUCCEEDED) {
        console.log(`[Webhook] Ignoring event type: ${rawData.event_type}`);
        return {
          received: true,
          ignored: true,
          reason: `Event type not supported: ${rawData.event_type}`,
        };
      }

      // 3. Check status - only process captured
      if (rawData.status !== "captured") {
        console.log(`[Webhook] Ignoring status: ${rawData.status}`);
        return {
          received: true,
          ignored: true,
          reason: `Status not captured: ${rawData.status}`,
        };
      }

      // 4. Check if payment already exists
      const transactionId = rawData.id;
      if (!transactionId) {
        console.log("[Webhook] Missing transaction ID");
        return {
          received: true,
          ignored: true,
          reason: "Missing transaction ID",
        };
      }

      const existingPayment = await prisma.payment.findFirst({
        where: { transactionId: transactionId },
      });

      if (existingPayment) {
        console.log(`[Webhook] Payment already processed: ${transactionId}`);
        return {
          received: true,
          ignored: true,
          reason: "Payment already processed",
        };
      }

      // 5. Validate webhook schema
      let validatedData: PaymentWebhookRequest;
      try {
        validatedData = PaymentWebhookRequest.parse(rawData);
      } catch (zodError) {
        if (zodError instanceof ZodError) {
          console.error("[Webhook] Schema validation failed:", zodError.issues);
          return {
            received: true,
            ignored: true,
            reason: `Invalid webhook data: ${zodError.issues[0]?.message}`,
          };
        }
        throw zodError;
      }

      // 6. Log webhook details for debugging
      console.log("[Webhook] Valid webhook received:", {
        transactionId: validatedData.id,
        amount: validatedData.amount,
        currency: validatedData.amount_currency,
        paymentType: validatedData.custom_data.details.paymentType,
        email: validatedData.custom_data.details.email,
        hasAffiliateLink: !!validatedData.custom_data.affiliateLink,
        affiliateLinkId: validatedData.custom_data.affiliateLink?.id,
      });

      // TODO: Future processing based on paymentType and affiliateLink
      // - If paymentType === "WORKSPACE_PURCHASE" && affiliateLink exists → Clone workspace
      // - If paymentType === "PLAN_PURCHASE" → Create/update subscription
      // - If paymentType === "ADD_ONS" → Process add-on purchase

      // For now, just return success
      return {
        received: true,
        message: "Webhook received and validated successfully",
      };
    } catch (error) {
      console.error("[Webhook] Unexpected error:", error);
      throw error;
    }
  }
}
