import axios from "axios";

/**
 * Cancels subscription on MamoPay side
 * @param subscriptionId - MamoPay subscription ID (e.g., 'MPB-SUB-D021309EFB')
 * @param subscriberId - MamoPay subscriber ID (e.g., 'MPB-SUBSCRIBER-0541E79878')
 * @returns true if successfully cancelled on MamoPay, false otherwise
 */
export async function cancelMamoPaySubscription(
  subscriptionId: string,
  subscriberId: string
): Promise<boolean> {
  try {
    console.log(
      `[MamoPay] Attempting to cancel subscription: ${subscriptionId}, subscriber: ${subscriberId}`
    );

    // Get MamoPay credentials
    const apiUrl = process.env.MAMOPAY_API_URL;
    const apiKey = process.env.MAMOPAY_API_KEY;

    if (!apiUrl || !apiKey) {
      console.error(
        "[MamoPay] MamoPay credentials not configured - skipping MamoPay cancellation"
      );
      return false;
    }

    const url = `${apiUrl}/manage_api/v1/subscriptions/${subscriptionId}/subscribers/${subscriberId}`;
    console.log(`[MamoPay] DELETE request to: ${url}`);

    // Cancel subscription on MamoPay
    await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    console.log(
      `[MamoPay] Successfully cancelled on MamoPay: ${subscriptionId}/${subscriberId}`
    );
    return true;
  } catch (error) {
    // Log error but don't throw - local cancellation should still succeed
    console.error(
      `[MamoPay] Failed to cancel on MamoPay for ${subscriptionId}/${subscriberId}:`
    );
    if (axios.isAxiosError(error)) {
      console.error(`[MamoPay] Status: ${error.response?.status}`);
      console.error(`[MamoPay] Response:`, error.response?.data);
      console.error(`[MamoPay] Request URL: ${error.config?.url}`);
    } else {
      console.error(error);
    }
    return false;
  }
}
