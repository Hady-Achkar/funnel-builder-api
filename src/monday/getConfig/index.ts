import { MondayConfig, MondayConfigSchema } from "../types";

/**
 * Validates Monday.com configuration using Zod schema
 * This is a pure validation function with no environment variable access
 *
 * @param config - Configuration object to validate
 * @returns Validated Monday.com configuration
 *
 * @example
 * ```typescript
 * const config = validateConfig({
 *   apiKey: "your-api-key",
 *   boardId: "1234567890",
 *   groupId: "new_group" // optional
 * });
 * ```
 */
export function validateConfig(config: Partial<MondayConfig>): MondayConfig {
  return MondayConfigSchema.parse(config);
}

/**
 * Gets Monday.com configuration from environment variables
 * Throws if required env vars are missing
 *
 * @returns Monday.com configuration
 * @throws Error if MONDAY_API_KEY or MONDAY_BOARD_ID is not set
 *
 * @example
 * ```typescript
 * const config = getConfigFromEnv();
 * const monday = getAxiosInstance(config);
 * ```
 */
export function getConfigFromEnv(): MondayConfig {
  const apiKey = process.env.MONDAY_API_KEY;
  const boardId = process.env.MONDAY_BOARD_ID;
  const groupId = process.env.MONDAY_GROUP_ID;

  if (!apiKey) {
    throw new Error("MONDAY_API_KEY environment variable is not configured");
  }

  if (!boardId) {
    throw new Error("MONDAY_BOARD_ID environment variable is not configured");
  }

  return validateConfig({
    apiKey,
    boardId,
    groupId: groupId || undefined,
  });
}

/**
 * Checks if Monday.com integration is configured
 * Returns false if required env vars are missing (does not throw)
 *
 * @returns boolean indicating if Monday integration is available
 */
export function isMondayConfigured(): boolean {
  return !!(process.env.MONDAY_API_KEY && process.env.MONDAY_BOARD_ID);
}
