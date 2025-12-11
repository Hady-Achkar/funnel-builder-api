import { getCircleConfig, isCircleConfigured } from "../getConfig";
import {
  CircleMemberData,
  CircleMemberDataSchema,
  CircleInviteResponse,
} from "../types";

const CIRCLE_API_BASE_URL = "https://app.circle.so/api/v1";

/**
 * Invite a member to the Circle community
 * This is a non-blocking operation - errors are logged but not thrown
 *
 * @param data - Member data (email, name)
 * @returns Invite response or null if failed
 *
 * @example
 * ```typescript
 * await inviteToCircle({
 *   email: "john@example.com",
 *   name: "John Doe"
 * });
 * ```
 */
export async function inviteToCircle(
  data: CircleMemberData
): Promise<CircleInviteResponse | null> {
  // Check if Circle integration is configured
  if (!isCircleConfigured()) {
    console.log(
      "[Circle] Integration not configured - skipping member invitation"
    );
    return null;
  }

  try {
    // Validate input data
    const validatedData = CircleMemberDataSchema.parse(data);

    // Get config from environment
    const config = getCircleConfig();

    console.log("[Circle] Inviting member to community:", {
      email: validatedData.email,
      name: validatedData.name,
      communityId: config.communityId,
    });

    // Build request payload
    const payload = {
      community_id: parseInt(config.communityId, 10),
      email: validatedData.email,
      name: validatedData.name,
      skip_invitation: false, // Circle will send invitation email
    };

    // Make API request
    const response = await fetch(
      `${CIRCLE_API_BASE_URL}/community_members`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Circle] API error:", {
        status: response.status,
        body: errorText,
      });
      return null;
    }

    const result: CircleInviteResponse = await response.json();

    console.log("[Circle] Member invited successfully:", {
      memberId: result.id,
      email: result.email,
    });

    return result;
  } catch (error) {
    // Log error but don't throw - this is a non-blocking operation
    console.error("[Circle] Failed to invite member:", error);
    return null;
  }
}
