import { getPrisma } from "../../../lib/prisma";
import {
  CancelSubscriptionResponse,
} from "../../../types/subscription/cancel";
import { cancelMamoPaySubscription } from "../../../utils/mamopay-utils/cancel-subscription";

export class CancelSubscriptionService {
  static async cancel(
    subscriptionId: string,
    userId: number
  ): Promise<CancelSubscriptionResponse> {
    try {
      const prisma = getPrisma();

      // First, fetch the subscription with subscriberId
      const existingSubscription = await prisma.subscription.findUnique({
        where: { subscriptionId },
        select: {
          subscriberId: true,
          subscriptionId: true,
        },
      });

      if (!existingSubscription) {
        throw new Error("Subscription not found");
      }

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

      // Attempt to cancel on MamoPay side
      let mamopayCancelled = false;
      if (existingSubscription.subscriberId) {
        mamopayCancelled = await cancelMamoPaySubscription(
          existingSubscription.subscriptionId,
          existingSubscription.subscriberId
        );
      }

      // Format response with user-friendly date
      const formattedDate = result.endsAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      return {
        message: `Subscription cancelled successfully. You will retain access until ${formattedDate}`,
        subscriptionId: result.subscriptionId,
        endsAt: result.endsAt,
        status: result.status,
        itemType: result.itemType,
        addonType: result.addonType,
        subscriptionType: result.subscriptionType,
        mamopayCancelled,
      };
    } catch (error) {
      console.error("[CancelSubscription] Error:", error);
      throw error;
    }
  }
}
