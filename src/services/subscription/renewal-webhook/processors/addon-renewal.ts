import { getPrisma } from "../../../../lib/prisma";
import sgMail from "@sendgrid/mail";
import {
  getAddonRenewalEmailHtml,
  getAddonRenewalEmailText,
} from "../../../../constants/emails/subscription/addon-renewal-confirmation";

interface AddonRenewalResult {
  success: boolean;
  message: string;
  userId: number;
  paymentId: number;
  subscriptionId: number;
  addonId: number;
}

export class AddonRenewalProcessor {
  static async process(webhookData: any): Promise<AddonRenewalResult> {
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
      const addonType = details.addonType;
      const paymentType = details.paymentType || "ADDON_PURCHASE";

      console.log("[AddonRenewal] Processing addon renewal:", {
        subscription_id,
        transactionId,
        next_payment_date,
        paymentType,
        addonType,
        email,
      });

      // 1. Find existing subscription
      const existingSubscription = await prisma.subscription.findUnique({
        where: { subscriptionId: subscription_id },
        include: {
          user: true,
        },
      });

      if (!existingSubscription) {
        throw new Error(
          `Subscription not found: ${subscription_id}. Cannot process addon renewal.`
        );
      }

      if (!existingSubscription.addonType) {
        throw new Error(
          `Subscription ${subscription_id} is not an addon subscription. Cannot process addon renewal.`
        );
      }

      // 2. Find the addon by userId and type matching subscription's addonType
      const addon = await prisma.addOn.findFirst({
        where: {
          userId: existingSubscription.userId,
          type: existingSubscription.addonType,
          status: { in: ["ACTIVE", "EXPIRED", "CANCELLED"] },
        },
        orderBy: {
          createdAt: "desc", // Get the most recent addon
        },
      });

      if (!addon) {
        throw new Error(
          `No addon found for subscription ${subscription_id}. Cannot process addon renewal.`
        );
      }

      console.log("[AddonRenewal] Found subscription and addon:", {
        subscriptionId: existingSubscription.id,
        addonId: addon.id,
        userId: existingSubscription.userId,
        addonType: existingSubscription.addonType,
        currentSubscriptionEndsAt: existingSubscription.endsAt,
        currentAddonEndsAt: addon.endDate,
      });

      // 3. Parse next_payment_date (DD/MM/YYYY format) to get new end date
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
          `[AddonRenewal] Using next_payment_date: ${next_payment_date} → ${newEndsAt.toISOString()}`
        );
      } catch (dateError) {
        console.error(
          "[AddonRenewal] Failed to parse next_payment_date:",
          dateError
        );
        throw new Error(
          `Invalid next_payment_date format: "${next_payment_date}". Expected DD/MM/YYYY.`
        );
      }

      // 4. Create Payment record for renewal
      const payment = await prisma.payment.create({
        data: {
          transactionId,
          amount,
          currency: amount_currency,
          status: webhookData.status,
          itemType: null, // itemType is for plan purchases, use addOnType instead
          paymentType: "ADDON_PURCHASE",
          buyerId: existingSubscription.userId,
          addOnType: addon.type,
          addOnQuantity: addon.quantity,
          addOnId: addon.id,
          rawData: [webhookData] as any,
          // NO affiliate fields - renewals don't generate commission
          affiliateLinkId: null,
          commissionAmount: null,
          commissionStatus: null,
        },
      });

      console.log("[AddonRenewal] Payment record created:", payment.id);

      // 5. Prepare updated subscription rawData - append new webhook to existing array
      const existingSubscriptionRawData =
        (existingSubscription.rawData as any) || [];

      // rawData is always an array now, just append
      const updatedSubscriptionRawData = Array.isArray(
        existingSubscriptionRawData
      )
        ? [...existingSubscriptionRawData, webhookData]
        : [existingSubscriptionRawData, webhookData]; // Fallback for old data

      console.log(
        "[AddonRenewal] Appending renewal webhook to rawData. Subscription entries:",
        updatedSubscriptionRawData.length
      );

      // 6. Update subscription with new end date, status, and accumulated rawData
      const updatedSubscription = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          endsAt: newEndsAt,
          status: "ACTIVE", // Override any previous status (e.g., EXPIRED, CANCELLED)
          rawData: updatedSubscriptionRawData, // Accumulated array of all webhook data
          updatedAt: new Date(),
        },
      });

      console.log(
        "[AddonRenewal] Subscription renewed until:",
        newEndsAt.toISOString()
      );

      // 7. Update addon with new end date and status (no rawData field in AddOn model)
      const updatedAddon = await prisma.addOn.update({
        where: { id: addon.id },
        data: {
          endDate: newEndsAt,
          status: "ACTIVE", // Override any previous status
          updatedAt: new Date(),
        },
      });

      console.log(
        "[AddonRenewal] Addon renewed until:",
        newEndsAt.toISOString()
      );

      // 8. Send addon renewal confirmation email
      try {
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
          throw new Error("SENDGRID_API_KEY is not configured");
        }
        sgMail.setApiKey(apiKey);

        // Map addon type to display name
        let addonName: string;
        let addonNameArabic: string;

        switch (addon.type) {
          case "EXTRA_CUSTOM_DOMAIN":
            addonName = "Domain";
            addonNameArabic = "النطاق";
            break;
          case "EXTRA_WORKSPACE":
            addonName = "Workspace";
            addonNameArabic = "مساحة العمل";
            break;
          case "EXTRA_SUBDOMAIN":
            addonName = "Subdomain";
            addonNameArabic = "النطاق الفرعي";
            break;
          case "EXTRA_ADMIN":
            addonName = "Admin";
            addonNameArabic = "مدير";
            break;
          case "EXTRA_FUNNEL":
            addonName = "Website"; // Use "Website" instead of "Funnel" - more user-friendly
            addonNameArabic = "الموقع"; // Use "الموقع" (website) instead of "مسار" (funnel)
            break;
          case "EXTRA_PAGE":
            addonName = "Page";
            addonNameArabic = "الصفحة";
            break;
          default:
            addonName = "Addon";
            addonNameArabic = "إضافة";
        }

        const emailData = {
          userEmail: existingSubscription.user.email,
          addonType: addon.type,
          subscriptionId: updatedSubscription.subscriptionId,
          nextPaymentDate: newEndsAt.toLocaleDateString("en-GB"), // DD/MM/YYYY format
        };

        await sgMail.send({
          to: existingSubscription.user.email,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || "noreply@digitalsite.com",
            name: "Digitalsite",
          },
          subject: `Addon Renewed - ${addonName} | تم تجديد الإضافة - ${addonNameArabic}`,
          html: getAddonRenewalEmailHtml(emailData),
          text: getAddonRenewalEmailText(emailData),
        });

        console.log(
          "[AddonRenewal] Renewal confirmation email sent to:",
          existingSubscription.user.email
        );
      } catch (emailError) {
        console.error(
          "[AddonRenewal] Failed to send renewal confirmation email:",
          emailError
        );
        // Continue processing even if email fails
      }

      return {
        success: true,
        message: "Addon renewed successfully",
        userId: existingSubscription.userId,
        paymentId: payment.id,
        subscriptionId: updatedSubscription.id,
        addonId: updatedAddon.id,
      };
    } catch (error) {
      console.error("[AddonRenewal] Error processing addon renewal:", error);
      throw error;
    }
  }
}
