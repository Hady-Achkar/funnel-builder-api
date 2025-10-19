import { getPrisma } from "../../../lib/prisma";
import {
  CancelSubscriptionResponse,
} from "../../../types/subscription/cancel";
import { cancelMamoPaySubscription } from "../../../utils/mamopay-utils/cancel-subscription";
import sgMail from "@sendgrid/mail";
import {
  getSubscriptionCancellationEmailHtml,
  getSubscriptionCancellationEmailText,
  SubscriptionCancellationData,
} from "../../../constants/emails/subscription/cancellation";

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
        // Update subscription status and include user data
        const subscription = await tx.subscription.update({
          where: {
            subscriptionId,
          },
          data: {
            status: "CANCELLED",
            updatedAt: new Date(),
          },
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
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

      // Send cancellation email to user
      try {
        const apiKey = process.env.SENDGRID_API_KEY;
        const fromEmail = process.env.SENDGRID_FROM_EMAIL;

        if (apiKey && fromEmail && result.user) {
          sgMail.setApiKey(apiKey);

          // Prepare user-friendly subscription type label
          let subscriptionTypeLabel = "";
          if (result.itemType === "PLAN") {
            // Map plan types to user-friendly names
            const planLabels: Record<string, string> = {
              BUSINESS: "Business Plan",
              AGENCY: "Agency Plan",
              FREE: "Free Plan",
            };
            subscriptionTypeLabel = planLabels[result.subscriptionType || ""] || "Plan";
          } else if (result.itemType === "ADDON") {
            // Map addon types to user-friendly names
            const addonLabels: Record<string, string> = {
              EXTRA_WORKSPACE: "Extra Workspace",
              EXTRA_ADMIN: "Additional Team Member",
              EXTRA_FUNNEL: "Additional Funnel",
              EXTRA_SUBDOMAIN: "Additional Subdomain",
              EXTRA_CUSTOM_DOMAIN: "Additional Custom Domain",
            };
            subscriptionTypeLabel = addonLabels[result.addonType || ""] || "Add-on";
          }

          const emailData: SubscriptionCancellationData = {
            recipientName: result.user.firstName || "User",
            subscriptionType: subscriptionTypeLabel,
            itemType: result.itemType,
            subscriptionId: result.subscriptionId,
            endsAt: result.endsAt,
            startsAt: result.startsAt,
          };

          await sgMail.send({
            to: result.user.email,
            from: {
              email: fromEmail,
              name: "Digitalsite",
            },
            subject: "Subscription Cancelled | تم إلغاء الاشتراك",
            html: getSubscriptionCancellationEmailHtml(emailData),
            text: getSubscriptionCancellationEmailText(emailData),
          });

          console.log(
            `[CancelSubscription] Cancellation email sent to ${result.user.email}`
          );
        }
      } catch (emailError) {
        // Log email error but don't fail the cancellation
        console.error(
          "[CancelSubscription] Failed to send cancellation email:",
          emailError
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
