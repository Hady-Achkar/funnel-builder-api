import { Subscription, AddOn } from "../../../generated/prisma-client";

/**
 * Centralized utility for validating if subscriptions and addons are still valid
 *
 * Valid means:
 * - Status is ACTIVE OR
 * - Status is CANCELLED but subscription period hasn't ended yet (endsAt > now)
 *
 * This allows cancelled subscriptions to continue providing access until the end of the paid period
 */
export class SubscriptionValidator {
  /**
   * Check if a subscription is still valid (provides access)
   *
   * @param subscription - The subscription to validate
   * @returns true if subscription is active or cancelled but not yet expired
   */
  static isValid(subscription: Subscription): boolean {
    const now = new Date();
    return (
      (subscription.status === "ACTIVE" || subscription.status === "CANCELLED") &&
      now < subscription.endsAt
    );
  }

  /**
   * Check if an addon is still valid (provides additional allocation)
   *
   * @param addon - The addon to validate
   * @returns true if addon is active or cancelled but not yet expired
   */
  static isAddonValid(addon: AddOn): boolean {
    const now = new Date();
    return (
      (addon.status === "ACTIVE" || addon.status === "CANCELLED") &&
      (!addon.endDate || now < addon.endDate)
    );
  }
}