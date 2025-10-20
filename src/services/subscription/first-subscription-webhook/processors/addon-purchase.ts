import { getPrisma } from "../../../../lib/prisma";
import { PaymentWebhookRequest } from "../../../../types/subscription/webhook";
import { FrequencyConverter } from "../../../../utils/subscription-utils/frequency-converter";
import { TrialPeriodCalculator } from "../../../../utils/common-functions/trial-period";
import {
  AddOnType,
  AddOnStatus,
  IntervalUnit,
} from "../../../../generated/prisma-client";

interface AddonPurchaseResult {
  success: boolean;
  message: string;
  userId: number;
  paymentId: number;
  addonId: number;
  subscriptionId: number;
}

export class AddonPurchaseProcessor {
  static async process(
    webhookData: PaymentWebhookRequest
  ): Promise<AddonPurchaseResult> {
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
        addonType,
        frequency,
        frequencyInterval,
        trialEndDate,
        workspaceId,
      } = details;

      // 1. Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        console.error("[AddonPurchase] User not found:", email);
        throw new Error(
          "User not found. Please sign up first before purchasing addons."
        );
      }

      if (!user.verified) {
        console.error("[AddonPurchase] User not verified:", email);
        throw new Error(
          "User email not verified. Please verify your email before purchasing addons."
        );
      }

      // 2. Calculate original price (remove 2% processing fee)
      const pricePerUnit = this.calculateOriginalPrice(amount);

      // 3. Determine if addon is user-level or workspace-level
      const isUserLevelAddon = this.isUserLevelAddon(addonType as AddOnType);
      const finalWorkspaceId = isUserLevelAddon ? null : workspaceId || null;

      // 4. If workspace-level addon, validate workspace exists
      if (!isUserLevelAddon && finalWorkspaceId) {
        const workspace = await prisma.workspace.findUnique({
          where: { id: finalWorkspaceId },
        });

        if (!workspace) {
          console.error(
            "[AddonPurchase] Workspace not found:",
            finalWorkspaceId
          );
          throw new Error(`Workspace not found: ${finalWorkspaceId}`);
        }
      }

      // 5. Convert frequency to billing cycle
      const billingCycle = this.mapFrequencyToIntervalUnit(frequency);

      // 6. Calculate start date (end date will be calculated later to match subscription)
      const startDate = new Date();

      // 7. Use transaction to create payment and addon atomically
      const result = await prisma.$transaction(async (tx) => {
        // Calculate subscription dates first to ensure AddOn and Subscription have matching dates
        const startsAt = startDate;
        const intervalUnit =
          FrequencyConverter.convertToIntervalUnit(frequency);
        const intervalCount = frequencyInterval || 1;

        // Calculate subscription end date
        const trialPeriod = FrequencyConverter.convertToTrialPeriod(
          frequency,
          intervalCount
        );
        const endsAt = TrialPeriodCalculator.calculateEndDate(
          startsAt,
          trialPeriod
        );

        // Create Payment record
        const payment = await tx.payment.create({
          data: {
            transactionId,
            amount,
            currency: amount_currency,
            status: webhookData.status,
            paymentType: "ADDON_PURCHASE",
            addOnType: addonType as AddOnType,
            addOnQuantity: 1, // Always 1 as per requirement
            buyerId: user.id,
            workspaceId: finalWorkspaceId,
            rawData: [webhookData] as any, // Store as array from the start
          },
        });

        // Create AddOn record with endDate matching subscription endsAt
        const addon = await tx.addOn.create({
          data: {
            userId: user.id,
            workspaceId: finalWorkspaceId,
            type: addonType as AddOnType,
            quantity: 1,
            pricePerUnit,
            status: AddOnStatus.ACTIVE,
            billingCycle,
            startDate,
            endDate: endsAt, // Use calculated subscription end date
          },
        });

        // Link payment to addon
        await tx.payment.update({
          where: { id: payment.id },
          data: { addOnId: addon.id },
        });

        // Handle referral commission if applicable
        if (user.referralLinkUsedId) {
          console.log(
            "[AddonPurchase] User has referral link, processing commission:",
            user.referralLinkUsedId
          );

          const affiliateLink = await tx.affiliateLink.findUnique({
            where: { id: user.referralLinkUsedId },
            include: { user: true },
          });

          const referrer = affiliateLink?.user;

          if (referrer) {
            const commissionAmount = this.calculateCommission(
              pricePerUnit,
              referrer.commissionPercentage
            );

            // Get current balance for transaction record
            const balanceBefore = referrer.pendingBalance || 0;
            const balanceAfter = balanceBefore + commissionAmount;

            // Update referrer's pending balance
            await tx.user.update({
              where: { id: referrer.id },
              data: { pendingBalance: balanceAfter },
            });

            // Create balance transaction record for audit trail
            await tx.balanceTransaction.create({
              data: {
                userId: referrer.id,
                type: "COMMISSION",
                amount: commissionAmount,
                balanceBefore,
                balanceAfter,
                referenceType: "ADDON_PURCHASE",
                referenceId: payment.id,
                notes: `Commission from ${user.email} addon purchase (${addonType})`,
                // releasedAt will be set later when commission is released
              },
            });
          } else {
            console.warn(
              "[AddonPurchase] Referrer not found:",
              user.referralLinkUsedId
            );
          }
        }

        // Create Subscription record for addon (using dates calculated earlier)
        const subscription = await tx.subscription.create({
          data: {
            subscriptionId: subscription_id || `SUB-ADDON-${transactionId}`,
            startsAt,
            endsAt,
            status: "ACTIVE",
            userId: user.id,
            intervalUnit,
            intervalCount,
            itemType: "ADDON",
            subscriptionType: null,
            addonType: addonType as AddOnType,
            rawData: [webhookData] as any, // Store as array from the start
          },
        });

        return { payment, addon, subscription };
      });

      return {
        success: true,
        message: "Addon purchased and activated successfully",
        userId: user.id,
        paymentId: result.payment.id,
        addonId: result.addon.id,
        subscriptionId: result.subscription.id,
      };
    } catch (error) {
      console.error("[AddonPurchase] Error processing ADDON_PURCHASE:", error);
      throw error;
    }
  }

  /**
   * Calculate original price by removing 2% processing fee
   */
  private static calculateOriginalPrice(amountWithFee: number): number {
    return Math.round((amountWithFee / 1.02) * 100) / 100;
  }

  /**
   * Calculate commission based on original price and percentage
   */
  private static calculateCommission(
    originalPrice: number,
    commissionPercentage: number
  ): number {
    return Math.round(originalPrice * (commissionPercentage / 100) * 100) / 100;
  }

  /**
   * Check if addon is user-level (EXTRA_WORKSPACE) or workspace-level
   */
  private static isUserLevelAddon(addonType: AddOnType): boolean {
    return addonType === AddOnType.EXTRA_WORKSPACE;
  }

  /**
   * Map frequency string to IntervalUnit enum
   */
  private static mapFrequencyToIntervalUnit(frequency: string): IntervalUnit {
    const normalized = frequency.toLowerCase();

    switch (normalized) {
      case "monthly":
        return IntervalUnit.MONTH;
      case "annually":
      case "yearly":
        return IntervalUnit.YEAR;
      case "weekly":
        return IntervalUnit.WEEK;
      default:
        console.warn(
          `[AddonPurchase] Unknown frequency: ${frequency}, defaulting to MONTH`
        );
        return IntervalUnit.MONTH;
    }
  }
}
