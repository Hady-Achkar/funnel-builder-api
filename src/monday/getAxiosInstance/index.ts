import axios, { AxiosInstance } from "axios";
import { MondayConfig } from "../types";

/**
 * Monday.com API Base URL
 * All Monday.com API calls use GraphQL at this endpoint
 */
const MONDAY_API_BASE = "https://api.monday.com/v2";

/**
 * Creates and returns a configured Axios instance for Monday.com API calls
 *
 * @param config - Monday configuration with API key
 * @returns Configured Axios instance
 *
 * @example
 * ```typescript
 * const monday = getAxiosInstance({
 *   apiKey: process.env.MONDAY_API_KEY!,
 *   boardId: process.env.MONDAY_BOARD_ID!
 * });
 *
 * const response = await monday.post('', {
 *   query: 'query { boards { id name } }'
 * });
 * ```
 */
export function getAxiosInstance(config: MondayConfig): AxiosInstance {
  return axios.create({
    baseURL: MONDAY_API_BASE,
    headers: {
      Authorization: config.apiKey,
      "Content-Type": "application/json",
    },
    timeout: 30000, // 30 seconds
  });
}
