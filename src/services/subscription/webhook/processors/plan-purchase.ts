import { getPrisma } from "../../../../lib/prisma";
import { PaymentWebhookRequest } from "../../../../types/subscription/webhook";
import { RegisterService } from "../../../auth/register";
import { FrequencyConverter } from "../../../../utils/subscription-utils/frequency-converter";
import { TrialPeriodCalculator } from "../../../../utils/common-functions/trial-period";
import { sendSetPasswordEmail } from "../../../../helpers/subscription/emails/set-password";
import crypto from "crypto";
import { UserPlan } from "../../../../generated/prisma-client";

interface PlanPurchaseResult {
  success: boolean;
  message: string;
  userId: number;
  paymentId: number;
  subscriptionId: number;
}

/**
 * Processes PLAN_PURCHASE webhook events
 * Handles subscription purchases without affiliate link
 */
export class PlanPurchaseProcessor {
  /**
   * Process PLAN_PURCHASE payment
   * - Creates new user if doesn't exist (using RegisterService)
   * - Generates passwordResetToken for new users
   * - Creates Payment record
   * - Creates Subscription record
   * - Sends password setup email
   */
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
      const {
        email,
        firstName,
        lastName,
        planType,
        frequency,
        frequencyInterval,
      } = details;

      console.log("[PlanPurchase] Processing PLAN_PURCHASE:", {
        email,
        planType,
        frequency,
        frequencyInterval,
        transactionId,
        subscription_id,
      });

      // 1. Check if this is a renewal (subscription already exists)
      if (subscription_id) {
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

      // 2. Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      let isNewUser = false;

      if (!user) {
        // 3. Create new user using RegisterService
        console.log("[PlanPurchase] Creating new user:", email);

        // Extract username from email (part before @)
        const username = email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_");

        // Convert frequency to trial period format
        const trialPeriod = FrequencyConverter.convertToTrialPeriod(
          frequency,
          frequencyInterval || 1
        );

        // Map planType to UserPlan enum
        const userPlan = this.mapPlanType(planType);

        // Generate a temporary password for registration (user will set their own via reset token)
        const tempPassword = crypto.randomBytes(16).toString("hex");

        // Register user
        const registerResult = await RegisterService.register({
          email: email.toLowerCase(),
          username,
          firstName,
          lastName,
          password: tempPassword,
          isAdmin: false,
          plan: userPlan,
          trialPeriod,
        });

        // Get the created user
        user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          throw new Error(
            "User creation failed - user not found after registration"
          );
        }

        isNewUser = true;
        console.log("[PlanPurchase] User created successfully:", user.id);
      } else {
        console.log("[PlanPurchase] User already exists:", user.id);
      }

      // 4. Generate password reset token for new users
      if (isNewUser) {
        const passwordResetToken = crypto.randomBytes(32).toString("hex");
        const passwordResetExpiresAt = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ); // 24 hours

        await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordResetToken,
            passwordResetExpiresAt,
          },
        });

        console.log(
          "[PlanPurchase] Password reset token generated for user:",
          user.id
        );

        // 5. Send password setup email
        try {
          await sendSetPasswordEmail(
            user.email,
            user.firstName,
            passwordResetToken
          );
          console.log(
            "[PlanPurchase] Password setup email sent to:",
            user.email
          );
        } catch (emailError) {
          console.error(
            "[PlanPurchase] Failed to send password setup email:",
            emailError
          );
          // Continue processing even if email fails
        }
      }

      // 6. Create Payment record
      const payment = await prisma.payment.create({
        data: {
          transactionId,
          amount,
          currency: amount_currency,
          status: webhookData.status,
          itemType: this.mapPlanType(planType),
          paymentType: "PLAN_PURCHASE",
          buyerId: user.id,
          rawData: webhookData as any, // Store complete webhook data
        },
      });

      console.log("[PlanPurchase] Payment record created:", payment.id);

      // 7. Calculate subscription dates
      const startsAt = new Date();
      const intervalUnit = FrequencyConverter.convertToIntervalUnit(frequency);
      const intervalCount = frequencyInterval || 1;

      // Calculate end date based on frequency
      const trialPeriod = FrequencyConverter.convertToTrialPeriod(
        frequency,
        intervalCount
      );
      const endsAt = TrialPeriodCalculator.calculateEndDate(
        startsAt,
        trialPeriod
      );

      // 8. Create Subscription record
      const subscription = await prisma.subscription.create({
        data: {
          subscriptionId: subscription_id || `SUB-${transactionId}`, // Use subscription_id from webhook or generate one
          startsAt,
          endsAt,
          status: "ACTIVE",
          userId: user.id,
          intervalUnit,
          intervalCount,
          subscriptionType: this.mapPlanType(planType),
          rawData: webhookData as any, // Store complete webhook data
        },
      });

      console.log(
        "[PlanPurchase] Subscription record created:",
        subscription.id
      );

      return {
        success: true,
        message: isNewUser
          ? "New user created, payment recorded, and subscription activated"
          : "Payment recorded and subscription activated for existing user",
        userId: user.id,
        paymentId: payment.id,
        subscriptionId: subscription.id,
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
    const { id: transactionId, amount, amount_currency, custom_data } = webhookData;
    const { details } = custom_data;
    const { frequency, frequencyInterval, planType } = details;

    console.log("[PlanPurchase] Processing renewal for user:", existingSubscription.userId);

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
        rawData: webhookData as any,
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
