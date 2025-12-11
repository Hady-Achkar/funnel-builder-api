import { CircleConfig } from "../types";

/**
 * Get Circle configuration from environment variables
 * @returns CircleConfig object
 * @throws Error if required environment variables are missing
 */
export function getCircleConfig(): CircleConfig {
  const apiToken = process.env.CIRCLE_API_TOKEN;
  const communityId = process.env.CIRCLE_COMMUNITY_ID;

  if (!apiToken) {
    throw new Error("CIRCLE_API_TOKEN environment variable is not set");
  }

  if (!communityId) {
    throw new Error("CIRCLE_COMMUNITY_ID environment variable is not set");
  }

  return {
    apiToken,
    communityId,
  };
}

/**
 * Check if Circle integration is configured
 * @returns true if all required environment variables are set
 */
export function isCircleConfigured(): boolean {
  return !!(process.env.CIRCLE_API_TOKEN && process.env.CIRCLE_COMMUNITY_ID);
}
