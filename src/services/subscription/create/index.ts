import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import { 
  subscriptionWebhookRequest,
  SubscriptionCreateResponse,
  SubscriptionCreateError
} from "../../../types/subscription/create";
import { PlanLimitsHelper } from "../../../helpers/auth/register";
import { sendSubscriptionVerificationEmail } from "../../../helpers/subscription/emails/create";
import { UsernameGenerator } from "../../../helpers/subscription/username-generator";
import { $Enums } from "../../../generated/prisma-client";

export class SubscriptionCreateService {
  static async createSubscription(webhookData: unknown): Promise<SubscriptionCreateResponse | SubscriptionCreateError> {
    const prisma = getPrisma();
    
    try {
      // 1. Handle ping/pong health check
      if (webhookData === 'ping') {
        return { received: true, ignored: true, message: 'pong' };
      }

      // 2. Validate webhook payload structure
      if (typeof webhookData !== 'object' || webhookData === null) {
        return { 
          error: 'Invalid webhook payload format',
          details: 'Payload must be a valid JSON object',
          stage: 'validation'
        };
      }

      // 3. Validate event type - only accept charge.succeeded
      const body = webhookData as any;
      if (body.event_type !== 'charge.succeeded') {
        return { received: true, ignored: true, message: 'Event type not supported' };
      }

      // 4. Validate webhook data against schema
      let validatedData;
      try {
        validatedData = subscriptionWebhookRequest.parse(body);
      } catch (error) {
        if (error instanceof ZodError) {
          const firstError = error.issues[0];
          return {
            error: 'Webhook validation failed',
            details: `${firstError.path.join('.')}: ${firstError.message}`,
            stage: 'validation'
          };
        }
        throw error;
      }

      // 5. Check for duplicate payment by transactionId
      const existingPayment = await prisma.payment.findUnique({
        where: { transactionId: validatedData.id }
      });

      if (existingPayment) {
        return {
          error: 'Payment already processed',
          details: `Transaction ID ${validatedData.id} has already been processed`,
          stage: 'duplicate_check'
        };
      }

      const { custom_data } = validatedData;
      const { details, affiliateLink } = custom_data;

      // 6. Generate unique username
      let username: string;
      try {
        username = await UsernameGenerator.generateUniqueUsername(
          details.firstName,
          details.lastName,
          details.email
        );
      } catch (error) {
        return {
          error: 'Failed to generate username',
          details: 'Could not create a unique username for the user',
          stage: 'user_creation'
        };
      }

      // 7. Check for existing user with same email
      const existingUser = await prisma.user.findUnique({
        where: { email: details.email }
      });

      if (existingUser) {
        return {
          error: 'User already exists',
          details: `User with email ${details.email} already exists`,
          stage: 'user_creation'
        };
      }

      // 8. Generate verification token and password (user will set their own)
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      const tokenData = {
        email: details.email,
        password: hashedPassword,
        timestamp: Date.now(),
      };
      const verificationToken = Buffer.from(JSON.stringify(tokenData)).toString("base64");
      const verificationTokenExpiresAt = new Date();
      verificationTokenExpiresAt.setHours(verificationTokenExpiresAt.getHours() + 24);

      // 9. Calculate plan limits
      const finalLimits = PlanLimitsHelper.calculateFinalLimits(details.planType, {
        maximumFunnels: details.funnels,
        maximumCustomDomains: details.customDomains,
        maximumSubdomains: details.subdomains,
      });

      // 10. Calculate trial dates based on subscription period
      const paymentCreatedDate = this.parseCreatedDate(validatedData.created_date);
      const trialStartDate = paymentCreatedDate;
      const trialEndDate = this.calculateEndDate(trialStartDate, details.frequency, details.frequencyInterval);

      // 11. Create user
      let createdUser;
      try {
        createdUser = await prisma.user.create({
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
            maximumFunnels: finalLimits.maximumFunnels,
            maximumCustomDomains: finalLimits.maximumCustomDomains,
            maximumSubdomains: finalLimits.maximumSubdomains,
            maximumAdmins: details.admins,
            trialStartDate,
            trialEndDate,
            referralLinkUsedId: affiliateLink?.id || null,
          },
        });
      } catch (error) {
        console.error('User creation failed:', error);
        return {
          error: 'Failed to create user account',
          details: 'Database error during user creation',
          stage: 'user_creation'
        };
      }

      // 12. Handle affiliate link processing if present
      let affiliateCommission = 0;
      if (affiliateLink) {
        try {
          // Find affiliate link by token
          const foundAffiliateLink = await prisma.affiliateLink.findUnique({
            where: { token: affiliateLink.token }
          });

          if (foundAffiliateLink) {
            // Update affiliate link total amount
            const affiliateAmount = affiliateLink.affiliateAmount || 0;
            await prisma.affiliateLink.update({
              where: { id: foundAffiliateLink.id },
              data: {
                totalAmount: {
                  increment: affiliateAmount
                }
              }
            });
            affiliateCommission = affiliateAmount;
          }
        } catch (error) {
          console.error('Affiliate processing failed:', error);
          return {
            error: 'Failed to process affiliate commission',
            details: 'Error updating affiliate link totals',
            stage: 'affiliate_processing'
          };
        }
      }

      // 13. Create payment record
      let createdPayment;
      try {
        createdPayment = await prisma.payment.create({
          data: {
            transactionId: validatedData.id,
            amount: validatedData.amount,
            currency: validatedData.amount_currency || 'USD',
            status: 'captured',
            itemType: details.planType,
            buyerId: createdUser.id,
            affiliateLinkId: affiliateLink?.id || null,
            level1AffiliateAmount: affiliateCommission || null,
            affiliatePaid: false,
            rawData: validatedData,
          },
        });
      } catch (error) {
        console.error('Payment creation failed:', error);
        return {
          error: 'Failed to create payment record',
          details: 'Database error during payment creation',
          stage: 'payment_creation'
        };
      }

      // 14. Calculate subscription dates
      const startsAt = this.parseCreatedDate(validatedData.created_date);
      const endsAt = this.calculateEndDate(startsAt, details.frequency, details.frequencyInterval);
      const intervalUnit = this.mapFrequencyToIntervalUnit(details.frequency);

      // 15. Create subscription record
      let createdSubscription;
      try {
        createdSubscription = await prisma.subscription.create({
          data: {
            subscriptionId: validatedData.subscription_id || `SUB_${validatedData.id}`,
            startsAt,
            endsAt,
            status: 'ACTIVE',
            userId: createdUser.id,
            intervalUnit,
            intervalCount: details.frequencyInterval,
            rawData: validatedData,
            subscriptionType: details.planType,
          },
        });
      } catch (error) {
        console.error('Subscription creation failed:', error);
        return {
          error: 'Failed to create subscription record',
          details: 'Database error during subscription creation',
          stage: 'subscription_creation'
        };
      }

      // 16. Send verification email
      try {
        await sendSubscriptionVerificationEmail(
          createdUser.email,
          createdUser.firstName,
          verificationToken
        );
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail the entire process for email error
        return {
          received: true,
          message: 'Subscription created successfully, but verification email failed to send',
          userId: createdUser.id,
          subscriptionId: createdSubscription.id,
          paymentId: createdPayment.id,
        };
      }

      return {
        received: true,
        message: 'Subscription created successfully',
        userId: createdUser.id,
        subscriptionId: createdSubscription.id,
        paymentId: createdPayment.id,
      };

    } catch (error) {
      console.error('Unexpected error in subscription creation:', error);
      return {
        error: 'Internal server error',
        details: 'An unexpected error occurred while processing the subscription',
        stage: 'user_creation'
      };
    }
  }

  /**
   * Parse webhook created_date string to Date object
   */
  private static parseCreatedDate(createdDate: string): Date {
    try {
      // Format: "2025-09-08-12-18-51"
      const parts = createdDate.split('-');
      if (parts.length === 6) {
        const [year, month, day, hour, minute, second] = parts.map(Number);
        return new Date(year, month - 1, day, hour, minute, second);
      }
      // Fallback to current date if parsing fails
      return new Date();
    } catch {
      return new Date();
    }
  }

  /**
   * Calculate subscription end date based on frequency and interval
   */
  private static calculateEndDate(startDate: Date, frequency: string, interval: number): Date {
    const endDate = new Date(startDate);
    
    switch (frequency) {
      case 'weekly':
        endDate.setDate(endDate.getDate() + (7 * interval));
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + interval);
        break;
      case 'annually':
        endDate.setFullYear(endDate.getFullYear() + interval);
        break;
      default:
        // Default to 1 month
        endDate.setMonth(endDate.getMonth() + 1);
    }
    
    return endDate;
  }

  /**
   * Map webhook frequency to IntervalUnit enum
   */
  private static mapFrequencyToIntervalUnit(frequency: string): $Enums.IntervalUnit {
    switch (frequency) {
      case 'weekly':
        return $Enums.IntervalUnit.WEEK;
      case 'monthly':
        return $Enums.IntervalUnit.MONTH;
      case 'annually':
        return $Enums.IntervalUnit.YEAR;
      default:
        return $Enums.IntervalUnit.MONTH;
    }
  }
}