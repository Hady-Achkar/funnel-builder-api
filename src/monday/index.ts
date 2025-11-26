/**
 * Monday.com Integration Module
 *
 * This module provides functions to interact with Monday.com boards via their GraphQL API.
 * It follows the same pattern as src/cloudflare for consistency.
 *
 * Environment Variables Required:
 * - MONDAY_API_KEY: Your Monday.com API token
 * - MONDAY_BOARD_ID: The board ID to create items on
 * - MONDAY_GROUP_ID: (Optional) The group ID within the board
 *
 * @example
 * ```typescript
 * import { addPartnerRegistration, isMondayConfigured } from "../monday";
 *
 * // Check if Monday integration is configured
 * if (isMondayConfigured()) {
 *   await addPartnerRegistration({
 *     firstName: "John",
 *     lastName: "Doe",
 *     email: "john@example.com",
 *     transactionId: "PAY-123",
 *     amount: 59.99,
 *     currency: "USD",
 *     isNewUser: true,
 *     createdAt: new Date().toISOString()
 *   });
 * }
 * ```
 */

// Types
export type {
  MondayConfig,
  MondayError,
  MondayAPIResponse,
  BoardColumn,
  Board,
  GetBoardResult,
  CreateItemInput,
  CreatedItem,
  CreateItemResult,
  PartnerRegistrationData,
} from "./types";

// Schemas (for validation)
export {
  MondayConfigSchema,
  MondayErrorSchema,
  MondayAPIResponseSchema,
  BoardColumnSchema,
  BoardSchema,
  GetBoardResultSchema,
  CreateItemInputSchema,
  CreatedItemSchema,
  CreateItemResultSchema,
  PartnerRegistrationDataSchema,
} from "./types";

// Configuration helpers
export {
  validateConfig,
  getConfigFromEnv,
  isMondayConfigured,
} from "./getConfig";

// API instance
export { getAxiosInstance } from "./getAxiosInstance";

// Board operations
export { getBoard } from "./getBoard";

// Item operations
export { createItem } from "./createItem";

// High-level functions
export { addPartnerRegistration } from "./addPartnerRegistration";
