import { getPrisma } from "../../../lib/prisma";
import { ZodError } from "zod";
import {
  PaymentWebhookRequest,
  WebhookResponse,
  WebhookEventType,
} from "../../../types/subscription/webhook";
import { PlanPurchaseProcessor } from "./processors/plan-purchase";
import { PlanPurchaseWithAffiliateProcessor } from "./processors/plan-purchase-with-affiliate";
import { AddonPurchaseProcessor } from "./processors/addon-purchase";
import { PartnerPlanPurchaseProcessor } from "./processors/partner-plan-purchase";
import { BusinessPlanPurchaseProcessor } from "./processors/business-plan-purchase";
import { fetchAndStoreSubscriberId } from "../../../utils/mamopay-utils/fetch-and-store-subscriber-id";

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

      // 6. Route to appropriate processor based on paymentType and affiliateLink
      const paymentType = validatedData.custom_data.details.paymentType;
      const hasAffiliateLink = !!validatedData.custom_data.affiliateLink;

      // Partner Plan identifiers - ALL must be present for Partner Plan flow
      const isPartnerPlan = !!validatedData.custom_data.isPartnerPlan;
      const isPartnerPlanFlow = validatedData.custom_data.plan === "partner";
      const isAdSource = validatedData.custom_data.registrationSource === "AD";

      // Business Plan identifiers - ALL must be present for Business Plan AD flow
      const isBusinessPlan = !!validatedData.custom_data.isBusinessPlan;
      const isBusinessPlanFlow = validatedData.custom_data.plan === "business";

      // Partner Plan purchase (payment-first registration flow)
      // Routes here when: ALL three Partner Plan identifiers are present
      // This ensures only payments from the specific MamoPay Partner Plan flow are processed
      if (paymentType === "PLAN_PURCHASE" && isPartnerPlan && isPartnerPlanFlow && isAdSource) {
        console.log("[Webhook] Routing to PartnerPlanPurchaseProcessor");
        const result = await PartnerPlanPurchaseProcessor.process(validatedData);

        // Fetch and store subscriberId from MamoPay (only for subscription-based payments)
        if (validatedData.subscription_id && result.subscriptionId) {
          await fetchAndStoreSubscriberId(
            result.subscriptionId,
            validatedData.subscription_id
          );
        }

        return {
          received: true,
          message: result.message,
          data: {
            userId: result.userId,
            paymentId: result.paymentId,
            subscriptionId: result.subscriptionId,
          },
        };
      }

      // Business Plan purchase (payment-first registration flow from AD)
      // Routes here when: ALL three Business Plan identifiers are present
      // This ensures only payments from the specific MamoPay Business Plan AD flow are processed
      if (paymentType === "PLAN_PURCHASE" && isBusinessPlan && isBusinessPlanFlow && isAdSource) {
        console.log("[Webhook] Routing to BusinessPlanPurchaseProcessor");
        const result = await BusinessPlanPurchaseProcessor.process(validatedData);

        // Fetch and store subscriberId from MamoPay (only for subscription-based payments)
        if (validatedData.subscription_id && result.subscriptionId) {
          await fetchAndStoreSubscriberId(
            result.subscriptionId,
            validatedData.subscription_id
          );
        }

        return {
          received: true,
          message: result.message,
          data: {
            userId: result.userId,
            paymentId: result.paymentId,
            subscriptionId: result.subscriptionId,
          },
        };
      }

      if (paymentType === "PLAN_PURCHASE" && !hasAffiliateLink) {
        const result = await PlanPurchaseProcessor.process(validatedData);

        // Fetch and store subscriberId from MamoPay (only for subscription-based payments)
        if (validatedData.subscription_id && result.subscriptionId) {
          await fetchAndStoreSubscriberId(
            result.subscriptionId,
            validatedData.subscription_id
          );
        }

        return {
          received: true,
          message: result.message,
          data: {
            userId: result.userId,
            paymentId: result.paymentId,
            subscriptionId: result.subscriptionId,
          },
        };
      }

      if (paymentType === "PLAN_PURCHASE" && hasAffiliateLink) {
        const result = await PlanPurchaseWithAffiliateProcessor.process(
          validatedData
        );

        // Fetch and store subscriberId from MamoPay (only for subscription-based payments)
        if (validatedData.subscription_id && result.subscriptionId) {
          await fetchAndStoreSubscriberId(
            result.subscriptionId,
            validatedData.subscription_id
          );
        }

        return {
          received: true,
          message: result.message,
          data: {
            userId: result.userId,
            paymentId: result.paymentId,
            subscriptionId: result.subscriptionId,
          },
        };
      }

      if (paymentType === "ADDON_PURCHASE") {
        const result = await AddonPurchaseProcessor.process(validatedData);

        // Fetch and store subscriberId from MamoPay
        await fetchAndStoreSubscriberId(
          result.subscriptionId,
          validatedData.subscription_id
        );

        return {
          received: true,
          message: result.message,
          data: {
            userId: result.userId,
            paymentId: result.paymentId,
            addonId: result.addonId,
            subscriptionId: result.subscriptionId,
          },
        };
      }

      return {
        received: true,
        ignored: true,
        reason: `Unknown payment type: ${paymentType}`,
      };
    } catch (error) {
      console.error("[Webhook] Unexpected error:", error);
      throw error;
    }
  }
}
