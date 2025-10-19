import { getPrisma } from "../../../lib/prisma";
import {
  CancelSubscriptionResponse,
} from "../../../types/subscription/cancel";

export class CancelSubscriptionService {
  static async cancel(
    subscriptionId: string,
    userId: number
  ): Promise<CancelSubscriptionResponse> {
    try {
      const prisma = getPrisma();

      // Update subscription to CANCELLED within a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update subscription status
        const subscription = await tx.subscription.update({
          where: {
            subscriptionId,
          },
          data: {
            status: "CANCELLED",
            updatedAt: new Date(),
          },
        });

        // If it's an addon subscription, update the related addon status as well
        if (subscription.itemType === "ADDON" && subscription.addonType) {
          await tx.addOn.updateMany({
            where: {
              userId,
              type: subscription.addonType,
              status: "ACTIVE",
            },
            data: {
              status: "CANCELLED",
              updatedAt: new Date(),
            },
          });
        }

        return subscription;
      });

      // Format response with user-friendly date
      const formattedDate = result.endsAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      return {
        message: `Subscription cancelled successfully. You will retain access until ${formattedDate}`,
        subscriptionId: result.subscriptionId,
        endsAt: result.endsAt,
        status: result.status,
        itemType: result.itemType,
        addonType: result.addonType,
        subscriptionType: result.subscriptionType,
      };
    } catch (error) {
      console.error("[CancelSubscription] Error:", error);
      throw error;
    }
  }
}
