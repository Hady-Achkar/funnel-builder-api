import { getPrisma } from "../../../../lib/prisma";
import { PaymentWebhookRequest } from "../../../../types/subscription/webhook";
import { RegisterService } from "../../../auth/register";
import { FrequencyConverter } from "../../../../utils/subscription-utils/frequency-converter";
import { TrialPeriodCalculator } from "../../../../utils/common-functions/trial-period";
import { sendSetPasswordEmail } from "../../../../helpers/subscription/emails/set-password";
import { sendAffiliateCongratulationsEmail } from "../../../../helpers/subscription/emails/affiliate/congratulations";
import { CloneWorkspaceService } from "../../../workspace/clone-workspace";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { UserPlan, RegistrationSource } from "../../../../generated/prisma-client";

interface PlanPurchaseWithAffiliateResult {
  success: boolean;
  message: string;
  userId: number;
  paymentId: number;
  subscriptionId: number;
}

export class PlanPurchaseWithAffiliateProcessor {
  static async process(
    webhookData: PaymentWebhookRequest
  ): Promise<PlanPurchaseWithAffiliateResult> {
    const prisma = getPrisma();

    try {
      const {
        custom_data,
        id: transactionId,
        amount,
        amount_currency,
        subscription_id,
      } = webhookData;
      const { details, affiliateLink } = custom_data;
      const {
        email,
        firstName,
        lastName,
        planType,
        frequency,
        frequencyInterval,
      } = details;

      if (!affiliateLink) {
        throw new Error(
          "affiliateLink is required for PlanPurchaseWithAffiliateProcessor"
        );
      }

      console.log("[PlanPurchaseAffiliate] Processing PLAN_PURCHASE:", {
        email,
        planType,
        frequency,
        frequencyInterval,
        transactionId,
        subscription_id,
        affiliateLinkId: affiliateLink.id,
        affiliateOwnerId: affiliateLink.userId,
      });

      // 1. Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      let isNewUser = false;

      if (!user) {
        // 2. Create new user using RegisterService
        console.log("[PlanPurchaseAffiliate] Creating new user:", email);

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

        // Register user (this sets trialStartDate and trialEndDate)
        const registerResult = await RegisterService.register(
          {
            email: email.toLowerCase(),
            username,
            firstName,
            lastName,
            password: tempPassword,
            isAdmin: false,
            plan: userPlan,
            trialPeriod,
          },
          RegistrationSource.DIRECT
        );

        // Get the created user
        user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          throw new Error(
            "User creation failed - user not found after registration"
          );
        }

        // 3. Link user to affiliate link
        await prisma.user.update({
          where: { id: user.id },
          data: {
            referralLinkUsedId: affiliateLink.id,
          },
        });

        console.log(
          "[PlanPurchaseAffiliate] User created and linked to affiliate:",
          user.id
        );

        isNewUser = true;
      } else {
        console.log("[PlanPurchaseAffiliate] User already exists:", user.id);
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
          "[PlanPurchaseAffiliate] Password reset token generated for user:",
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
            "[PlanPurchaseAffiliate] Password setup email sent to:",
            user.email
          );
        } catch (emailError) {
          console.error(
            "[PlanPurchaseAffiliate] Failed to send password setup email:",
            emailError
          );
          // Continue processing even if email fails
        }
      }

      // 6. Get affiliate owner for commission calculation
      const affiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateLink.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          plan: true,
          partnerLevel: true,
          totalSales: true,
          balance: true,
          pendingBalance: true, // NEW: Include pending balance
          commissionPercentage: true,
        },
      });

      if (!affiliateOwner) {
        throw new Error(`Affiliate owner not found: ${affiliateLink.userId}`);
      }

      // 7. Calculate commission amount (flat rate)
      const commissionAmount = this.calculateCommission(
        affiliateOwner.plan,
        affiliateOwner.partnerLevel,
        planType,
        amount // Pass payment amount for percentage calculation
      );

      console.log("[PlanPurchaseAffiliate] Commission calculation:", {
        affiliateOwnerPlan: affiliateOwner.plan,
        buyerPlan: planType,
        partnerLevel: affiliateOwner.partnerLevel,
        commissionAmount,
      });

      // 8. Create Payment record with commission hold
      const commissionHeldUntil = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ); // 30 days from now

      const payment = await prisma.payment.create({
        data: {
          transactionId,
          amount,
          currency: amount_currency,
          status: webhookData.status,
          itemType: this.mapPlanType(planType),
          paymentType: "PLAN_PURCHASE",
          buyerId: user.id,
          affiliateLinkId: affiliateLink.id,
          level1AffiliateAmount: commissionAmount, // Keep for backward compatibility
          affiliatePaid: false, // Keep for backward compatibility
          commissionAmount, // NEW: Commission amount
          commissionStatus:
            commissionAmount > 0 ? "PENDING" : null, // NEW: On hold if commission exists
          commissionHeldUntil:
            commissionAmount > 0 ? commissionHeldUntil : null, // NEW: Release date
          rawData: webhookData as any,
        },
      });

      console.log(
        "[PlanPurchaseAffiliate] Payment record created:",
        payment.id
      );

      // 9. Calculate subscription dates
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

      // 10. Create Subscription record
      const subscription = await prisma.subscription.create({
        data: {
          subscriptionId: subscription_id || `SUB-${transactionId}`,
          startsAt,
          endsAt,
          status: "ACTIVE",
          userId: user.id,
          intervalUnit,
          intervalCount,
          subscriptionType: this.mapPlanType(planType),
          rawData: webhookData as any,
        },
      });

      console.log(
        "[PlanPurchaseAffiliate] Subscription record created:",
        subscription.id
      );

      // 11. Extract workspace data (from explicit field OR decode from token)
      let workspaceData: {
        id: number;
        name: string;
        slug: string;
        sellerId: number;
      } | null = null;

      // Check if workspace is explicitly provided
      if (webhookData.custom_data.workspace) {
        workspaceData = webhookData.custom_data.workspace;
        console.log(
          "[PlanPurchaseAffiliate] Using explicit workspace data:",
          workspaceData.id
        );
      }
      // If not, try to decode from affiliateLink.token
      else if (custom_data.affiliateLink?.token) {
        try {
          const jwtSecret = process.env.JWT_SECRET;
          if (!jwtSecret) {
            console.warn(
              "[PlanPurchaseAffiliate] JWT_SECRET not configured, cannot decode workspace from token"
            );
          } else {
            // Decode token
            const decoded = jwt.verify(
              custom_data.affiliateLink.token,
              jwtSecret
            ) as any;

            if (decoded.workspaceId) {
              console.log(
                "[PlanPurchaseAffiliate] Decoded workspaceId from token:",
                decoded.workspaceId
              );

              // Fetch workspace from database
              const workspace = await prisma.workspace.findUnique({
                where: { id: decoded.workspaceId },
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  ownerId: true,
                },
              });

              if (workspace) {
                workspaceData = {
                  id: workspace.id,
                  name: workspace.name,
                  slug: workspace.slug,
                  sellerId: workspace.ownerId,
                };
                console.log(
                  "[PlanPurchaseAffiliate] Workspace fetched from database:",
                  workspaceData.id
                );
              } else {
                console.warn(
                  "[PlanPurchaseAffiliate] Workspace not found:",
                  decoded.workspaceId
                );
              }
            }
          }
        } catch (tokenError) {
          console.warn(
            "[PlanPurchaseAffiliate] Failed to decode token or fetch workspace:",
            tokenError
          );
          // Continue without workspace cloning
        }
      }

      // 12. Clone workspace if data available
      let clonedWorkspaceId: number | null = null;
      if (workspaceData) {
        console.log(
          "[PlanPurchaseAffiliate] Cloning workspace:",
          workspaceData.id
        );

        try {
          const cloneResult = await CloneWorkspaceService.cloneWorkspace({
            sourceWorkspaceId: workspaceData.id,
            newOwnerId: user.id,
            paymentId: transactionId,
            planType: this.mapPlanType(planType),
          });

          clonedWorkspaceId = cloneResult.clonedWorkspaceId;

          console.log(
            "[PlanPurchaseAffiliate] Workspace cloned successfully:",
            clonedWorkspaceId
          );
        } catch (cloneError) {
          console.error(
            "[PlanPurchaseAffiliate] Workspace cloning failed:",
            cloneError
          );
          // Don't fail the entire transaction if workspace cloning fails
          // The payment and subscription are already created
        }
      } else {
        console.log(
          "[PlanPurchaseAffiliate] No workspace data available for cloning"
        );
      }

      // 13. Process commission if eligible
      if (commissionAmount > 0) {
        await this.processCommission(
          affiliateOwner,
          commissionAmount,
          payment.id,
          email,
          planType,
          prisma
        );
      }

      return {
        success: true,
        message: isNewUser
          ? "New user created with affiliate link, payment recorded, and subscription activated"
          : "Payment recorded and subscription activated for existing user with affiliate tracking",
        userId: user.id,
        paymentId: payment.id,
        subscriptionId: subscription.id,
      };
    } catch (error) {
      console.error(
        "[PlanPurchaseAffiliate] Error processing PLAN_PURCHASE:",
        error
      );
      throw error;
    }
  }

  /**
   * Calculate commission amount based on partner level
   * ONLY pays commission if: invitor.plan === AGENCY && buyer.plan === BUSINESS
   * Commission is calculated as FLAT RATE:
   * - Level 1: $50
   * - Level 2: $75
   * - Level 3: $100
   *
   * Note: commissionPercentage (5%/10%/15%) is stored for future add-on calculations
   */
  private static calculateCommission(
    invitorPlan: UserPlan,
    partnerLevel: number,
    buyerPlanType: string,
    paymentAmount: number
  ): number {
    // Commission only if AGENCY invites BUSINESS
    if (invitorPlan !== UserPlan.AGENCY || buyerPlanType !== "BUSINESS") {
      return 0;
    }

    // Determine flat commission amount based on partner level
    switch (partnerLevel) {
      case 1:
        return 50; // $50 flat rate
      case 2:
        return 75; // $75 flat rate
      case 3:
        return 100; // $100 flat rate
      default:
        return 50; // Default to Level 1 ($50)
    }
  }

  /**
   * Process commission payment to affiliate owner (30-day hold)
   * - Adds commission to pendingBalance (NOT available balance)
   * - Increments totalSales
   * - Creates BalanceTransaction (COMMISSION_HOLD)
   * - Sets release date to 30 days from now
   * - Updates partner level if thresholds reached
   * - Marks payment as paid (backward compatibility)
   * - Updates affiliate link stats
   * - Sends congratulations email
   */
  private static async processCommission(
    affiliateOwner: {
      id: number;
      email: string;
      firstName: string;
      plan: UserPlan;
      partnerLevel: number;
      totalSales: number;
      balance: number;
      pendingBalance: number; // NEW: Include pending balance
      commissionPercentage: number;
    },
    commissionAmount: number,
    paymentId: number,
    buyerEmail: string,
    buyerPlanType: string,
    prisma: any
  ): Promise<void> {
    console.log("[PlanPurchaseAffiliate] Processing commission:", {
      affiliateOwnerId: affiliateOwner.id,
      commissionAmount,
      currentBalance: affiliateOwner.balance,
      currentPendingBalance: affiliateOwner.pendingBalance,
      currentTotalSales: affiliateOwner.totalSales,
    });

    // 1. Update affiliate owner pendingBalance (NOT available balance) and totalSales (atomic)
    const updatedUser = await prisma.user.update({
      where: { id: affiliateOwner.id },
      data: {
        pendingBalance: { increment: commissionAmount }, // NEW: Hold in pending, not available
        totalSales: { increment: 1 },
      },
    });

    console.log("[PlanPurchaseAffiliate] Affiliate pending balance updated:", {
      newPendingBalance: updatedUser.pendingBalance,
      availableBalance: updatedUser.balance, // Unchanged
      newTotalSales: updatedUser.totalSales,
    });

    // 2. Create BalanceTransaction for audit trail (COMMISSION_HOLD)
    await prisma.balanceTransaction.create({
      data: {
        userId: affiliateOwner.id,
        type: "COMMISSION_HOLD", // NEW: Indicates held commission
        amount: commissionAmount,
        balanceBefore: affiliateOwner.balance, // Available balance unchanged
        balanceAfter: affiliateOwner.balance, // Available balance unchanged
        referenceType: "Payment",
        referenceId: paymentId,
        releasedAt: null, // NULL until actually released (not the scheduled date)
        notes: `Commission held for 30 days - ${buyerPlanType} plan referral from ${buyerEmail}`,
      },
    });

    console.log(
      "[PlanPurchaseAffiliate] BalanceTransaction (COMMISSION_HOLD) created for payment:",
      paymentId,
      "- Will be released in 30 days if not refunded"
    );

    // 3. Check and update partner level if thresholds reached
    const newTotalSales = updatedUser.totalSales;
    const currentPartnerLevel = affiliateOwner.partnerLevel;

    if (newTotalSales >= 50 && currentPartnerLevel < 3) {
      // Upgrade to Level 3 and update commission percentage to 15%
      await prisma.user.update({
        where: { id: affiliateOwner.id },
        data: {
          partnerLevel: 3,
          commissionPercentage: 15,
        },
      });
      console.log(
        "[PlanPurchaseAffiliate] Partner level upgraded to 3 (50+ sales)"
      );
    } else if (newTotalSales >= 10 && currentPartnerLevel < 2) {
      // Upgrade to Level 2 and update commission percentage to 10%
      await prisma.user.update({
        where: { id: affiliateOwner.id },
        data: {
          partnerLevel: 2,
          commissionPercentage: 10,
        },
      });
      console.log(
        "[PlanPurchaseAffiliate] Partner level upgraded to 2 with 10% commission (10+ sales)"
      );
    }

    // 4. Mark payment as paid
    await prisma.payment.update({
      where: { id: paymentId },
      data: { affiliatePaid: true },
    });

    console.log("[PlanPurchaseAffiliate] Payment marked as paid:", paymentId);

    // 5. Update affiliate link stats
    const affiliateLinkId = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { affiliateLinkId: true },
    });

    if (affiliateLinkId?.affiliateLinkId) {
      await prisma.affiliateLink.update({
        where: { id: affiliateLinkId.affiliateLinkId },
        data: {
          totalAmount: { increment: commissionAmount },
        },
      });

      console.log(
        "[PlanPurchaseAffiliate] AffiliateLink stats updated:",
        affiliateLinkId.affiliateLinkId
      );
    }

    // 6. Send congratulations email to affiliate owner
    try {
      await sendAffiliateCongratulationsEmail(
        affiliateOwner.email,
        affiliateOwner.firstName
      );
      console.log(
        "[PlanPurchaseAffiliate] Congratulations email sent to:",
        affiliateOwner.email
      );
    } catch (emailError) {
      console.error(
        "[PlanPurchaseAffiliate] Failed to send congratulations email:",
        emailError
      );
      // Continue processing even if email fails
    }
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
          `[PlanPurchaseAffiliate] Unknown plan type: ${planType}, defaulting to FREE`
        );
        return UserPlan.FREE;
    }
  }
}
