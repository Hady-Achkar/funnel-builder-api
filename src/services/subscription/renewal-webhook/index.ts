import { getPrisma } from "../../../lib/prisma";
import { RenewalWebhookResponse } from "../../../types/subscription/renewal-webhook";
import { PlanRenewalProcessor } from "./processors/plan-renewal";
import { fetchAndStoreSubscriberId } from "../../../utils/mamopay-utils/fetch-and-store-subscriber-id";

export class RenewalWebhookService {
  static async processWebhook(data: unknown): Promise<RenewalWebhookResponse> {
    try {
      const prisma = getPrisma();

      // 1. Early return if not an object
      if (typeof data !== "object" || data === null) {
        console.log("[RenewalWebhook] Invalid payload format - not an object");
        return {
          received: true,
          ignored: true,
          reason: "Invalid payload format",
        };
      }

      const webhookData = data as any;

      // 2. Check event type - only process subscription.succeeded
      if (webhookData.event_type !== "subscription.succeeded") {
        console.log(
          `[RenewalWebhook] Ignoring event type: ${webhookData.event_type}`
        );
        return {
          received: true,
          ignored: true,
          reason: "Only subscription.succeeded events are processed",
        };
      }

      // 3. Check status - only process captured
      if (webhookData.status !== "captured") {
        console.log(`[RenewalWebhook] Ignoring status: ${webhookData.status}`);
        return {
          received: true,
          ignored: true,
          reason: `Status not captured: ${webhookData.status}`,
        };
      }

      // 4. Check if payment already exists (idempotency)
      const transactionId = webhookData.id;
      if (!transactionId) {
        console.log("[RenewalWebhook] Missing transaction ID");
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
        console.log(
          `[RenewalWebhook] Payment already processed: ${transactionId}`
        );
        return {
          received: true,
          ignored: true,
          reason: "Payment already processed",
        };
      }

      // 5. Route to plan renewal processor (no strict Zod validation - flexible structure)
      // For now, we only handle plan renewals
      // Later we can add addon renewal processor
      const result = await PlanRenewalProcessor.process(webhookData);

      // 6. Fetch and store subscriberId from MamoPay
      await fetchAndStoreSubscriberId(
        result.subscriptionId,
        webhookData.subscription_id
      );

      return {
        received: true,
        message: result.message,
        data: {
          userId: result.userId,
          paymentId: result.paymentId,
          subscriptionId: result.subscriptionId,
        },
      };
    } catch (error) {
      console.error("[RenewalWebhook] Unexpected error:", error);
      throw error;
    }
  }
}
