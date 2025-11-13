import { getPrisma } from "../../../../lib/prisma";
import { PaymentWebhookRequest } from "../../../../types/subscription/webhook";
import { FrequencyConverter } from "../../../../utils/subscription-utils/frequency-converter";
import {
  TrialPeriodCalculator,
  calculateTrialDates,
} from "../../../../utils/common-functions/trial-period";
import {
  getSubscriptionConfirmationEmailHtml,
  getSubscriptionConfirmationEmailText,
} from "../../../../constants/emails/subscription/confirmation";
import { UserPlan } from "../../../../generated/prisma-client";
import sgMail from "@sendgrid/mail";

interface PlanPurchaseResult {
  success: boolean;
  message: string;
  userId: number;
  paymentId: number;
  subscriptionId: number | null;
}
export class PlanPurchaseProcessor {
  static async process(
    webhookData: PaymentWebhookRequest
  ): Promise<PlanPurchaseResult> {
    const prisma = getPrisma();

    try {
      const {
        custom_data,
        id: transactionId,
        amount,
        amount_currency,
        subscription_id,
      } = webhookData;
      const { details } = custom_data;
      const { email, planType, frequency, frequencyInterval } = details;

      console.log("[PlanPurchase] Processing PLAN_PURCHASE:", {
        email,
        planType,
        frequency,
        frequencyInterval,
        transactionId,
        subscription_id,
      });

      // 1. Detect payment model (subscription vs one-time)
      const isSubscription = !!subscription_id;
      console.log("[PlanPurchase] Payment model detected:", {
        isSubscription,
        subscription_id,
      });

      // 2. Check if this is a renewal (subscription already exists) - only for subscription-based payments
      if (isSubscription) {
        const existingSubscription = await prisma.subscription.findUnique({
          where: { subscriptionId: subscription_id },
          include: { user: true },
        });

        if (existingSubscription) {
          console.log(
            "[PlanPurchase] Renewal detected for subscription:",
            subscription_id
          );
          return await this.handleRenewal(
            existingSubscription,
            webhookData,
            prisma
          );
        }
      }

      // 2. Find user by userId (if provided) OR email
      const userIdFromCustomData = custom_data.userId;
      let user = null;

      // Try to find by userId first (from logged-in user creating payment link)
      if (userIdFromCustomData) {
        console.log(
          "[PlanPurchase] Looking up user by userId:",
          userIdFromCustomData
        );
        user = await prisma.user.findUnique({
          where: { id: userIdFromCustomData },
        });

        // Security check: verify email matches
        if (user && user.email.toLowerCase() !== email.toLowerCase()) {
          console.error(
            "[PlanPurchase] Email mismatch security check failed:",
            {
              userIdFromData: userIdFromCustomData,
              emailFromUser: user.email,
              emailFromTransaction: email,
            }
          );
          throw new Error("Security validation failed: email mismatch");
        }
      }

      // Fallback to email lookup if userId not provided or user not found
      if (!user) {
        console.log("[PlanPurchase] Looking up user by email:", email);
        user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
      }

      // REJECT if user doesn't exist - user must be signed up first
      if (!user) {
        console.error(
          "[PlanPurchase] User not found. User must be registered before subscribing:",
          email
        );
        throw new Error(
          "User not found. Please sign up first before making a payment."
        );
      }

      // REJECT if user is not verified
      if (!user.verified) {
        console.error(
          "[PlanPurchase] User not verified. User must verify email before subscribing:",
          email
        );
        throw new Error(
          "User email not verified. Please verify your email before making a payment."
        );
      }

      console.log("[PlanPurchase] User found and verified:", user.id);

      // 3. Update existing user's plan
      const userPlan = this.mapPlanType(planType);

      // Calculate trial dates based on payment model
      let trialDates;
      if (isSubscription) {
        // For subscription-based payments: calculate trial period normally
        const trialPeriod = FrequencyConverter.convertToTrialPeriod(
          frequency,
          frequencyInterval || 1
        );
        trialDates = calculateTrialDates(trialPeriod);
      } else {
        // For one-time payments: lifetime access (trialEndDate = null)
        trialDates = {
          trialStartDate: new Date(),
          trialEndDate: null,
        };
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: userPlan,
          trialStartDate: trialDates.trialStartDate,
          trialEndDate: trialDates.trialEndDate,
        },
      });

      console.log("[PlanPurchase] Updated user plan:", {
        userId: user.id,
        newPlan: userPlan,
        isSubscription,
        trialEndDate: trialDates.trialEndDate,
      });

      // 4. Create Payment record
      const payment = await prisma.payment.create({
        data: {
          transactionId,
          amount,
          currency: amount_currency,
          status: webhookData.status,
          itemType: this.mapPlanType(planType),
          paymentType: "PLAN_PURCHASE",
          buyerId: user.id,
          rawData: [webhookData] as any, // Store as array from the start
        },
      });

      console.log("[PlanPurchase] Payment record created:", payment.id);

      // 5. Create Subscription record (only for subscription-based payments)
      let subscription = null;
      if (isSubscription) {
        const startsAt = new Date();
        const intervalUnit = FrequencyConverter.convertToIntervalUnit(frequency);
        const intervalCount = frequencyInterval || 1;

        // Calculate end date based on frequency
        const trialPeriod = FrequencyConverter.convertToTrialPeriod(
          frequency,
          frequencyInterval || 1
        );
        const endsAt = TrialPeriodCalculator.calculateEndDate(
          startsAt,
          trialPeriod
        );

        subscription = await prisma.subscription.create({
          data: {
            subscriptionId: subscription_id, // Required for subscriptions
            startsAt,
            endsAt,
            status: "ACTIVE",
            userId: user.id,
            intervalUnit,
            intervalCount,
            itemType: "PLAN",
            subscriptionType: this.mapPlanType(planType),
            addonType: null,
            rawData: [webhookData] as any, // Store as array from the start
          },
        });

        console.log(
          "[PlanPurchase] Subscription record created:",
          subscription.id
        );
      } else {
        console.log(
          "[PlanPurchase] One-time payment - no subscription record created"
        );
      }

      // 6. Send confirmation email to buyer (only for subscription-based payments)
      if (isSubscription && subscription) {
        try {
          const apiKey = process.env.SENDGRID_API_KEY;
          if (!apiKey) {
            throw new Error("SENDGRID_API_KEY is not configured");
          }
          sgMail.setApiKey(apiKey);

          const emailData = {
            userEmail: user.email,
            planType: this.mapPlanType(planType) as "BUSINESS" | "AGENCY",
            subscriptionId: subscription.subscriptionId,
          };

          const planName = emailData.planType === "BUSINESS" ? "Business" : "Partner Plan";
          const planNameArabic = emailData.planType === "BUSINESS" ? "الأعمال" : "الشريك";

          await sgMail.send({
            to: user.email,
            from: {
              email: process.env.SENDGRID_FROM_EMAIL,
              name: "Digitalsite",
            },
            subject: `Subscription Confirmed - ${planName} Plan | تأكيد الاشتراك - خطة ${planNameArabic}`,
            html: getSubscriptionConfirmationEmailHtml(emailData),
            text: getSubscriptionConfirmationEmailText(emailData),
          });

          console.log(
            "[PlanPurchase] Subscription confirmation email sent to:",
            user.email
          );
        } catch (emailError) {
          console.error(
            "[PlanPurchase] Failed to send subscription confirmation email:",
            emailError
          );
          // Continue processing even if email fails
        }
      }

      return {
        success: true,
        message: isSubscription
          ? "Payment recorded and subscription activated for existing user"
          : "Payment recorded and lifetime access granted",
        userId: user.id,
        paymentId: payment.id,
        subscriptionId: subscription ? subscription.id : null,
      };
    } catch (error) {
      console.error("[PlanPurchase] Error processing PLAN_PURCHASE:", error);
      throw error;
    }
  }

  /**
   * Handle subscription renewal
   * - Creates new Payment record
   * - Extends subscription end date
   */
  private static async handleRenewal(
    existingSubscription: any,
    webhookData: PaymentWebhookRequest,
    prisma: any
  ): Promise<PlanPurchaseResult> {
    const {
      id: transactionId,
      amount,
      amount_currency,
      custom_data,
    } = webhookData;
    const { details } = custom_data;
    const { frequency, frequencyInterval, planType } = details;

    console.log(
      "[PlanPurchase] Processing renewal for user:",
      existingSubscription.userId
    );

    // 1. Create Payment record for renewal
    const payment = await prisma.payment.create({
      data: {
        transactionId,
        amount,
        currency: amount_currency,
        status: webhookData.status,
        itemType: this.mapPlanType(planType),
        paymentType: "PLAN_PURCHASE",
        buyerId: existingSubscription.userId,
        rawData: [webhookData] as any, // Store as array from the start
      },
    });

    console.log("[PlanPurchase] Renewal payment record created:", payment.id);

    // 2. Calculate new end date (extend from current end date)
    const trialPeriod = FrequencyConverter.convertToTrialPeriod(
      frequency,
      frequencyInterval || 1
    );
    const newEndsAt = TrialPeriodCalculator.calculateEndDate(
      existingSubscription.endsAt,
      trialPeriod
    );

    // 3. Update subscription with new end date
    const updatedSubscription = await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        endsAt: newEndsAt,
        status: "ACTIVE", // Ensure it's active
        updatedAt: new Date(),
      },
    });

    console.log(
      "[PlanPurchase] Subscription renewed until:",
      newEndsAt.toISOString()
    );

    // 4. Send subscription confirmation email for renewal
    try {
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        throw new Error("SENDGRID_API_KEY is not configured");
      }
      sgMail.setApiKey(apiKey);

      const emailData = {
        userEmail: existingSubscription.user.email,
        planType: this.mapPlanType(planType) as "BUSINESS" | "AGENCY",
        subscriptionId: updatedSubscription.subscriptionId,
      };

      const planName = emailData.planType === "BUSINESS" ? "Business" : "Partner Plan";
      const planNameArabic = emailData.planType === "BUSINESS" ? "الأعمال" : "الشريك";

      await sgMail.send({
        to: existingSubscription.user.email,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: "Digitalsite",
        },
        subject: `Subscription Confirmed - ${planName} Plan | تأكيد الاشتراك - خطة ${planNameArabic}`,
        html: getSubscriptionConfirmationEmailHtml(emailData),
        text: getSubscriptionConfirmationEmailText(emailData),
      });

      console.log(
        "[PlanPurchase] Renewal confirmation email sent to:",
        existingSubscription.user.email
      );
    } catch (emailError) {
      console.error(
        "[PlanPurchase] Failed to send renewal confirmation email:",
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
  }

  /**
   * Map webhook planType string to UserPlan enum
   */
  private static mapPlanType(planType: string): UserPlan {
    const normalizedPlan = planType.toUpperCase();

    switch (normalizedPlan) {
      case "BUSINESS":
        return UserPlan.BUSINESS;
      case "AGENCY":
        return UserPlan.AGENCY;
      case "FREE":
        return UserPlan.FREE;
      default:
        console.warn(
          `[PlanPurchase] Unknown plan type: ${planType}, defaulting to FREE`
        );
        return UserPlan.FREE;
    }
  }
}
