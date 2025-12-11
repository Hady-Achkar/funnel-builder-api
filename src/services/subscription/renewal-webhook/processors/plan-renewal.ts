import { getPrisma } from "../../../../lib/prisma";
import { UserPlan } from "../../../../generated/prisma-client";
import sgMail from "@sendgrid/mail";
import {
  getSubscriptionRenewalEmailHtml,
  getSubscriptionRenewalEmailText,
} from "../../../../constants/emails/subscription/renewal-confirmation";

interface PlanRenewalResult {
  success: boolean;
  message: string;
  userId: number;
  paymentId: number;
  subscriptionId: number;
}

export class PlanRenewalProcessor {
  static async process(webhookData: any): Promise<PlanRenewalResult> {
    const prisma = getPrisma();

    try {
      const {
        id: transactionId,
        amount,
        amount_currency,
        subscription_id,
        next_payment_date,
        custom_data,
        customer_details,
      } = webhookData;

      // Extract details from custom_data (flexible - handle different structures)
      const details = custom_data?.details || {};
      const email = details.email || customer_details?.email;
      const planType = details.planType;
      const addonType = details.addonType;
      const paymentType = details.paymentType || "PLAN_PURCHASE";

      console.log("[PlanRenewal] Processing plan renewal:", {
        subscription_id,
        transactionId,
        next_payment_date,
        paymentType,
        planType,
        addonType,
        email,
      });

      // 1. Find existing subscription
      const existingSubscription = await prisma.subscription.findUnique({
        where: { subscriptionId: subscription_id },
        include: { user: true },
      });

      if (!existingSubscription) {
        throw new Error(
          `Subscription not found: ${subscription_id}. Cannot process renewal.`
        );
      }

      console.log("[PlanRenewal] Found subscription:", {
        id: existingSubscription.id,
        userId: existingSubscription.userId,
        currentEndsAt: existingSubscription.endsAt,
      });

      // 2. Parse next_payment_date (DD/MM/YYYY format) to get new end date
      if (!next_payment_date) {
        throw new Error(
          "next_payment_date is required for renewal but was not provided"
        );
      }

      let newEndsAt: Date;
      try {
        // Parse DD/MM/YYYY format inline
        const parts = next_payment_date.split("/");

        if (parts.length !== 3) {
          throw new Error(
            `Invalid date format: "${next_payment_date}". Expected DD/MM/YYYY format.`
          );
        }

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        // Validate numbers
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
          throw new Error(
            `Invalid date values in: "${next_payment_date}". Could not parse day, month, or year.`
          );
        }

        // Create date in UTC to avoid timezone issues
        newEndsAt = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

        // Verify the date is valid (e.g., not 31/02/2025)
        if (
          newEndsAt.getUTCDate() !== day ||
          newEndsAt.getUTCMonth() !== month - 1 ||
          newEndsAt.getUTCFullYear() !== year
        ) {
          throw new Error(
            `Invalid date: "${next_payment_date}". This date does not exist in the calendar.`
          );
        }

        console.log(
          `[PlanRenewal] Using next_payment_date: ${next_payment_date} → ${newEndsAt.toISOString()}`
        );
      } catch (dateError) {
        console.error(
          "[PlanRenewal] Failed to parse next_payment_date:",
          dateError
        );
        throw new Error(
          `Invalid next_payment_date format: "${next_payment_date}". Expected DD/MM/YYYY.`
        );
      }

      // 3. Create Payment record for renewal
      const payment = await prisma.payment.create({
        data: {
          transactionId,
          amount,
          currency: amount_currency,
          status: webhookData.status,
          itemType: existingSubscription.subscriptionType || UserPlan.FREE,
          paymentType: "PLAN_PURCHASE", // Same type for renewals
          buyerId: existingSubscription.userId,
          rawData: webhookData as any,
          // NO affiliate fields - renewals don't generate commission
          affiliateLinkId: null,
          commissionAmount: null,
          commissionStatus: null,
        },
      });

      console.log("[PlanRenewal] Payment record created:", payment.id);

      // 4. Prepare updated rawData - append new webhook to existing array
      const existingRawData = (existingSubscription.rawData as any) || [];

      // rawData is always an array now, just append
      const updatedRawData = Array.isArray(existingRawData)
        ? [...existingRawData, webhookData]
        : [existingRawData, webhookData]; // Fallback for old data

      console.log(
        "[PlanRenewal] Appending renewal webhook to rawData. Total entries:",
        updatedRawData.length
      );

      // 5. Update subscription with new end date, status, and accumulated rawData
      const updatedSubscription = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          endsAt: newEndsAt,
          status: "ACTIVE", // Override any previous status (e.g., EXPIRED, CANCELLED)
          rawData: updatedRawData, // Accumulated array of all webhook data
          updatedAt: new Date(),
        },
      });

      console.log(
        "[PlanRenewal] Subscription renewed until:",
        newEndsAt.toISOString()
      );

      // 6. Update user's trialEndDate if this is a PLAN renewal (not addon)
      if (paymentType === "PLAN_PURCHASE" && planType) {
        await prisma.user.update({
          where: { id: existingSubscription.userId },
          data: {
            trialEndDate: newEndsAt, // Extend user's trial/plan end date
          },
        });
        console.log(
          "[PlanRenewal] User trialEndDate extended to:",
          newEndsAt.toISOString()
        );
      }

      // 7. Send renewal confirmation email
      try {
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
          throw new Error("SENDGRID_API_KEY is not configured");
        }
        sgMail.setApiKey(apiKey);

        const userPlan =
          existingSubscription.subscriptionType || UserPlan.BUSINESS;
        const emailData = {
          userEmail: existingSubscription.user.email,
          planType: userPlan as "BUSINESS" | "AGENCY",
          subscriptionId: updatedSubscription.subscriptionId,
          nextPaymentDate: newEndsAt.toLocaleDateString("en-GB"), // DD/MM/YYYY format
        };

        const planName =
          emailData.planType === "BUSINESS" ? "Business" : "Partner Plan";
        const planNameArabic =
          emailData.planType === "BUSINESS" ? "الأعمال" : "الشريك";

        await sgMail.send({
          to: existingSubscription.user.email,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || "noreply@digitalsite.com",
            name: "Digitalsite",
          },
          subject: `Subscription Renewed - ${planName} Plan | تم تجديد الاشتراك - خطة ${planNameArabic}`,
          html: getSubscriptionRenewalEmailHtml(emailData),
          text: getSubscriptionRenewalEmailText(emailData),
        });

        console.log(
          "[PlanRenewal] Renewal confirmation email sent to:",
          existingSubscription.user.email
        );
      } catch (emailError) {
        console.error(
          "[PlanRenewal] Failed to send renewal confirmation email:",
          emailError
        );
        // Continue processing even if email fails
      }

      return {
        success: true,
        message: "Subscription renewed successfully",
        userId: existingSubscription.userId,
        paymentId: payment.id,
        subscriptionId: updatedSubscription.id,
      };
    } catch (error) {
      console.error("[PlanRenewal] Error processing plan renewal:", error);
      throw error;
    }
  }
}
