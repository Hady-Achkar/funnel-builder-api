import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors/http-errors";
import {
  subscriptionWebhookRequest,
  SubscriptionCreateResponse,
} from "../../../types/subscription/create";
import { PlanLimitsHelper } from "../../../helpers/auth/register";
import { sendSubscriptionVerificationEmail } from "../../../helpers/subscription/emails/create";
import { sendAffiliateCongratulationsEmail } from "../../../helpers/subscription/emails/affiliate/congratulations";
import { UsernameGenerator } from "../../../helpers/subscription/username-generator";
import { parseCreatedDate } from "../../../helpers/subscription/date-parser";
import { calculateEndDate } from "../../../helpers/subscription/end-date-calculator";
import { mapFrequencyToIntervalUnit } from "../../../helpers/subscription/frequency-mapper";
import { TemporaryPasswordGenerator } from "../../../helpers/subscription/password-generator";

export class SubscriptionCreateService {
  static async createSubscription(
    webhookData: unknown
  ): Promise<SubscriptionCreateResponse> {
    try {
      const prisma = getPrisma();

      // 1. Handle ping/pong health check
      if (webhookData === "ping") {
        return { received: true, ignored: true, message: "pong" };
      }

      // 2. Validate webhook payload structure
      if (typeof webhookData !== "object" || webhookData === null) {
        throw new BadRequestError("Invalid webhook payload format");
      }

      // 3. Validate event type - only accept charge.succeeded
      const body = webhookData as any;
      if (body.event_type !== "charge.succeeded") {
        return {
          received: true,
          ignored: true,
          message: "Event type not supported",
        };
      }

      // 4. Validate webhook data against schema
      const validatedData = subscriptionWebhookRequest.parse(body);

      // 5. Check for duplicate payment by transactionId
      const existingPayment = await prisma.payment.findUnique({
        where: { transactionId: validatedData.id },
      });

      if (existingPayment) {
        return {
          received: true,
          ignored: true,
          message: "Payment already processed",
        };
      }

      const { custom_data } = validatedData;
      const { details, affiliateLink } = custom_data;

      // 6. Generate unique username
      const username = await UsernameGenerator.generateUniqueUsername(
        details.firstName,
        details.lastName,
        details.email
      );

      // 7. Check for existing user with same email
      const existingUser = await prisma.user.findUnique({
        where: { email: details.email },
      });

      if (existingUser) {
        throw new BadRequestError(
          `User with email ${details.email} already exists`
        );
      }

      // 8. Generate verification token and readable temporary password
      const tempPassword = TemporaryPasswordGenerator.generateReadablePassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const tokenData = {
        email: details.email,
        password: hashedPassword,
        timestamp: Date.now(),
      };
      const verificationToken = Buffer.from(JSON.stringify(tokenData)).toString(
        "base64"
      );
      const verificationTokenExpiresAt = new Date();
      verificationTokenExpiresAt.setHours(
        verificationTokenExpiresAt.getHours() + 24
      );

      // 9. Calculate plan limits
      const finalLimits = PlanLimitsHelper.calculateFinalLimits(
        details.planType
      );

      // 10. Calculate trial dates based on subscription period
      const paymentCreatedDate = parseCreatedDate(validatedData.created_date);
      const trialStartDate = paymentCreatedDate;
      const trialEndDate = calculateEndDate(
        trialStartDate,
        details.frequency,
        details.frequencyInterval
      );

      // 11. Create user
      const createdUser = await prisma.user.create({
        data: {
          email: details.email,
          username,
          firstName: details.firstName,
          lastName: details.lastName,
          password: hashedPassword,
          verified: false,
          verificationToken,
          verificationTokenExpiresAt,
          isAdmin: false,
          plan: details.planType,
          maximumWorkspaces: finalLimits.maximumWorkspaces,
          trialStartDate,
          trialEndDate,
          referralLinkUsedId: affiliateLink?.id || null,
        },
      });

      // 12. Handle affiliate link processing if present
      let affiliateCommission = 0;
      if (affiliateLink) {
        // Find affiliate link by token
        const foundAffiliateLink = await prisma.affiliateLink.findUnique({
          where: { token: affiliateLink.token },
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
              },
            },
          },
        });

        if (foundAffiliateLink) {
          // Update affiliate link total amount
          const affiliateAmount = affiliateLink.affiliateAmount || 0;
          await prisma.affiliateLink.update({
            where: { id: foundAffiliateLink.id },
            data: {
              totalAmount: {
                increment: affiliateAmount,
              },
            },
          });
          affiliateCommission = affiliateAmount;

          // Send congratulations email to affiliate owner
          try {
            await sendAffiliateCongratulationsEmail(
              foundAffiliateLink.user.email,
              foundAffiliateLink.user.firstName
            );
          } catch (emailError) {
            console.error("Failed to send affiliate congratulations email:", emailError);
          }
        }
      }

      // 13. Create payment record
      const createdPayment = await prisma.payment.create({
        data: {
          transactionId: validatedData.id,
          amount: validatedData.amount,
          currency: validatedData.amount_currency || "USD",
          status: "captured",
          itemType: details.planType,
          buyerId: createdUser.id,
          affiliateLinkId: affiliateLink?.id || null,
          level1AffiliateAmount: affiliateCommission || null,
          affiliatePaid: false,
          rawData: JSON.parse(JSON.stringify(validatedData)),
        },
      });

      // 14. Calculate subscription dates
      const startsAt = parseCreatedDate(validatedData.created_date);
      const endsAt = calculateEndDate(
        startsAt,
        details.frequency,
        details.frequencyInterval
      );
      const intervalUnit = mapFrequencyToIntervalUnit(details.frequency);

      // 15. Create subscription record
      const createdSubscription = await prisma.subscription.create({
        data: {
          subscriptionId:
            validatedData.subscription_id || `SUB_${validatedData.id}`,
          startsAt,
          endsAt,
          status: "ACTIVE",
          userId: createdUser.id,
          intervalUnit,
          intervalCount: details.frequencyInterval,
          rawData: JSON.parse(JSON.stringify(validatedData)),
          subscriptionType: details.planType,
        },
      });

      // 16. Send verification email with temporary password
      try {
        await sendSubscriptionVerificationEmail(
          createdUser.email,
          createdUser.firstName,
          verificationToken,
          tempPassword
        );
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      return {
        received: true,
        message: "Subscription created successfully",
        userId: createdUser.id,
        subscriptionId: createdSubscription.id,
        paymentId: createdPayment.id,
      };
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid request data";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}
