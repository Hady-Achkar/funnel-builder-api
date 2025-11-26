import { getAxiosInstance } from "../getAxiosInstance";
import {
  MondayConfig,
  MondayAPIResponse,
  GetBoardResult,
  Board,
} from "../types";

/**
 * GraphQL query to fetch board details including columns
 */
const GET_BOARD_QUERY = `
  query GetBoard($boardId: [ID!]!) {
    boards(ids: $boardId) {
      id
      name
      columns {
        id
        title
        type
      }
    }
  }
`;

/**
 * Fetches board details including all columns from Monday.com
 *
 * @param config - Monday.com configuration
 * @returns Board details with columns
 * @throws Error if board not found or API error
 *
 * @example
 * ```typescript
 * const board = await getBoard({
 *   apiKey: process.env.MONDAY_API_KEY!,
 *   boardId: "1234567890"
 * });
 *
 * console.log(board.columns);
 * // [{ id: "text0", title: "Name", type: "text" }, ...]
 * ```
 */
export async function getBoard(config: MondayConfig): Promise<Board> {
  const monday = getAxiosInstance(config);

  const response = await monday.post<MondayAPIResponse<GetBoardResult>>("", {
    query: GET_BOARD_QUERY,
    variables: {
      boardId: [config.boardId],
    },
  });

  if (response.data.errors && response.data.errors.length > 0) {
    const errorMessages = response.data.errors.map((e) => e.message).join("; ");
    throw new Error(`Monday.com getBoard error: ${errorMessages}`);
  }

  const boards = response.data.data?.boards;

  if (!boards || boards.length === 0) {
    throw new Error(`Board with ID ${config.boardId} not found`);
  }

  return boards[0];
}
