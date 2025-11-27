import { getPrisma } from "../../../../lib/prisma";
import { PaymentWebhookRequest } from "../../../../types/subscription/webhook";
import { FrequencyConverter } from "../../../../utils/subscription-utils/frequency-converter";
import {
  TrialPeriodCalculator,
  calculateTrialDates,
} from "../../../../utils/common-functions/trial-period";
import {
  getPartnerWelcomeEmailHtml,
  getPartnerWelcomeEmailText,
} from "../../../../constants/emails/auth/partner-welcome";
import {
  UserPlan,
  RegistrationSource,
} from "../../../../generated/prisma-client";
import { generateUsername } from "../../../../utils/auth/generate-username";
import { generateTempPassword } from "../../../../utils/auth/generate-temp-password";
import bcrypt from "bcryptjs";
import sgMail from "@sendgrid/mail";
import { addPartnerRegistration } from "../../../../monday";

interface PartnerPlanPurchaseResult {
  success: boolean;
  message: string;
  userId: number;
  paymentId: number;
  subscriptionId: number | null;
}

export class PartnerPlanPurchaseProcessor {
  /**
   * Process Partner Plan purchase for payment-first registration
   * Creates new user account if user doesn't exist
   * User details come from MamoPay's customer_details (not custom_data.details)
   */
  static async process(
    webhookData: PaymentWebhookRequest
  ): Promise<PartnerPlanPurchaseResult> {
    const prisma = getPrisma();

    try {
      const {
        custom_data,
        customer_details,
        id: transactionId,
        amount,
        amount_currency,
        subscription_id,
      } = webhookData;

      // Validate this is actually a Partner Plan payment from the correct source
      if (
        !custom_data.isPartnerPlan ||
        custom_data.plan !== "partner" ||
        custom_data.registrationSource !== "AD"
      ) {
        throw new Error(
          "Invalid Partner Plan payment: missing required identifiers (isPartnerPlan, plan=partner, registrationSource=AD)"
        );
      }

      const { details, registrationSource: sourceFromWebhook } = custom_data;
      const { frequency, frequencyInterval } = details;

      // Extract user details from MamoPay's customer_details
      const email = customer_details.email;
      const { firstName, lastName } = this.parseCustomerName(
        customer_details.name
      );

      // Get registration source from webhook custom_data (defaults to AD)
      const regSource =
        sourceFromWebhook === "AD"
          ? RegistrationSource.AD
          : RegistrationSource.AD;

      console.log("[PartnerPlanPurchase] Processing Partner Plan purchase:", {
        email,
        firstName,
        lastName,
        transactionId,
        subscription_id,
        registrationSource: regSource,
      });

      // 1. Detect payment model (subscription vs one-time)
      const isSubscription = !!subscription_id;
      console.log("[PartnerPlanPurchase] Payment model detected:", {
        isSubscription,
        subscription_id,
      });

      // 2. Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      let tempPassword: string | null = null;
      let isNewUser = false;

      if (user) {
        // User exists - update their plan
        console.log(
          "[PartnerPlanPurchase] Existing user found, updating plan:",
          user.id
        );

        // Calculate trial dates based on payment model
        const trialDates = this.calculateTrialDates(
          isSubscription,
          frequency,
          frequencyInterval
        );

        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: UserPlan.AGENCY,
            verified: true, // Ensure verified
            trialStartDate: trialDates.trialStartDate,
            trialEndDate: trialDates.trialEndDate,
          },
        });
      } else {
        // 3. Create new user
        isNewUser = true;
        console.log("[PartnerPlanPurchase] Creating new user for:", email);

        // Generate unique username
        const username = await generateUsername(firstName, lastName);

        // Generate temporary password
        tempPassword = generateTempPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Calculate trial dates based on payment model
        const trialDates = this.calculateTrialDates(
          isSubscription,
          frequency,
          frequencyInterval
        );

        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            username,
            firstName,
            lastName,
            password: hashedPassword,
            verified: true, // Auto-verified since they paid
            plan: UserPlan.AGENCY,
            registrationSource: regSource,
            trialStartDate: trialDates.trialStartDate,
            trialEndDate: trialDates.trialEndDate,
          },
        });

        console.log("[PartnerPlanPurchase] New user created:", {
          userId: user.id,
          username: user.username,
        });
      }

      // 4. Create Payment record
      const payment = await prisma.payment.create({
        data: {
          transactionId,
          amount,
          currency: amount_currency,
          status: webhookData.status,
          itemType: UserPlan.AGENCY,
          paymentType: "PLAN_PURCHASE",
          buyerId: user.id,
          rawData: [webhookData] as any,
        },
      });

      console.log("[PartnerPlanPurchase] Payment record created:", payment.id);

      // 5. Create Subscription record (only for subscription-based payments)
      let subscription = null;
      if (isSubscription) {
        const startsAt = new Date();
        const intervalUnit =
          FrequencyConverter.convertToIntervalUnit(frequency);
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
            subscriptionId: subscription_id,
            startsAt,
            endsAt,
            status: "ACTIVE",
            userId: user.id,
            intervalUnit,
            intervalCount,
            itemType: "PLAN",
            subscriptionType: UserPlan.AGENCY,
            addonType: null,
            rawData: [webhookData] as any,
          },
        });

        console.log(
          "[PartnerPlanPurchase] Subscription record created:",
          subscription.id
        );
      } else {
        console.log(
          "[PartnerPlanPurchase] One-time payment - no subscription record created"
        );
      }

      // 6. Send welcome email with credentials (only for new users)
      if (isNewUser && tempPassword) {
        await this.sendWelcomeEmail(user, tempPassword);
      }

      // 7. Add to Monday.com board (non-blocking)
      addPartnerRegistration({
        firstName,
        lastName,
        email,
        phone: customer_details.phone_number || undefined,
        transactionId,
        amount,
        currency: amount_currency,
        isNewUser,
        createdAt: new Date().toISOString(),
      }).catch((err) => {
        console.error(
          "[PartnerPlanPurchase] Monday.com registration failed (non-blocking):",
          err
        );
      });

      return {
        success: true,
        message: isNewUser
          ? "Partner Plan purchased and user account created"
          : "Partner Plan purchased for existing user",
        userId: user.id,
        paymentId: payment.id,
        subscriptionId: subscription ? subscription.id : null,
      };
    } catch (error) {
      console.error(
        "[PartnerPlanPurchase] Error processing Partner Plan purchase:",
        error
      );
      throw error;
    }
  }

  /**
   * Calculate trial dates based on payment model
   */
  private static calculateTrialDates(
    isSubscription: boolean,
    frequency: string,
    frequencyInterval: number | undefined
  ): { trialStartDate: Date; trialEndDate: Date | null } {
    if (isSubscription) {
      // For subscription-based payments: calculate trial period normally
      const trialPeriod = FrequencyConverter.convertToTrialPeriod(
        frequency,
        frequencyInterval || 1
      );
      return calculateTrialDates(trialPeriod);
    } else {
      // For one-time payments: lifetime access (trialEndDate = null)
      return {
        trialStartDate: new Date(),
        trialEndDate: null,
      };
    }
  }

  /**
   * Parse customer name from MamoPay into firstName and lastName
   */
  private static parseCustomerName(fullName: string): {
    firstName: string;
    lastName: string;
  } {
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length === 1) {
      return { firstName: nameParts[0], lastName: "" };
    }
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");
    return { firstName, lastName };
  }

  /**
   * Send welcome email with login credentials
   */
  private static async sendWelcomeEmail(
    user: { id: number; email: string; firstName: string },
    temporaryPassword: string
  ): Promise<void> {
    try {
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        throw new Error("SENDGRID_API_KEY is not configured");
      }
      sgMail.setApiKey(apiKey);

      const loginUrl = `${process.env.FRONTEND_URL}/login`;

      const emailData = {
        firstName: user.firstName,
        email: user.email,
        temporaryPassword,
        loginUrl,
      };

      await sgMail.send({
        to: user.email,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || "noreply@digitalsite.io",
          name: "Digitalsite",
        },
        subject:
          "Welcome to Digitalsite - Partner Plan | مرحبًا بك في Digitalsite - خطة الشريك",
        html: getPartnerWelcomeEmailHtml(emailData),
        text: getPartnerWelcomeEmailText(emailData),
      });

      console.log(
        "[PartnerPlanPurchase] Welcome email sent to:",
        user.email
      );
    } catch (emailError) {
      console.error(
        "[PartnerPlanPurchase] Failed to send welcome email:",
        emailError
      );
      // Continue processing even if email fails
      // User can use forgot password flow if needed
    }
  }
}
