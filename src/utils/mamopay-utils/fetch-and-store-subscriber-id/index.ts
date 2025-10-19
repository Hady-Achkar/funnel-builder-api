import { getPrisma } from "../../../lib/prisma";
import axios from "axios";

/**
 * Fetches subscriberId from MamoPay API and stores it in the database
 * @param subscriptionDatabaseId - The database ID of the subscription
 * @param mamoPaySubscriptionId - The MamoPay subscription ID (e.g., 'MPB-SUB-D021309EFB')
 */
export async function fetchAndStoreSubscriberId(
  subscriptionDatabaseId: number,
  mamoPaySubscriptionId: string | null
): Promise<void> {
  try {
    // Skip if no MamoPay subscription ID
    if (!mamoPaySubscriptionId) {
      console.log(
        `[MamoPay] No MamoPay subscription ID for subscription ${subscriptionDatabaseId}`
      );
      return;
    }

    // Get MamoPay credentials
    const apiUrl = process.env.MAMOPAY_API_URL;
    const apiKey = process.env.MAMOPAY_API_KEY;

    if (!apiUrl || !apiKey) {
      console.error(
        "[MamoPay] MamoPay credentials not configured - skipping subscriberId fetch"
      );
      return;
    }

    // Fetch subscribers from MamoPay API
    const response = await axios.get(
      `${apiUrl}/manage_api/v1/subscriptions/${mamoPaySubscriptionId}/subscribers`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Get the first subscriber ID from the array
    const subscriberId = response.data?.[0]?.id;

    if (!subscriberId) {
      console.log(
        `[MamoPay] No subscribers found for MamoPay subscription ${mamoPaySubscriptionId}`
      );
      return;
    }

    // Update database with subscriberId
    const prisma = getPrisma();
    await prisma.subscription.update({
      where: { id: subscriptionDatabaseId },
      data: { subscriberId },
    });

    console.log(
      `[MamoPay] Stored subscriberId ${subscriberId} for subscription ${subscriptionDatabaseId}`
    );
  } catch (error) {
    // Log error but don't throw - webhook processing should continue
    console.error(
      `[MamoPay] Failed to fetch/store subscriberId for subscription ${subscriptionDatabaseId}:`,
      error
    );
  }
}
