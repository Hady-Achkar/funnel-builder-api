import { getAxiosInstance } from "../getAxiosInstance";
import {
  MondayConfig,
  MondayAPIResponse,
  CreateItemInput,
  CreateItemInputSchema,
  CreateItemResult,
  CreatedItem,
} from "../types";

/**
 * GraphQL mutation to create an item on a board
 */
const CREATE_ITEM_MUTATION = `
  mutation CreateItem($boardId: ID!, $groupId: String, $itemName: String!, $columnValues: JSON) {
    create_item(
      board_id: $boardId
      group_id: $groupId
      item_name: $itemName
      column_values: $columnValues
    ) {
      id
      name
    }
  }
`;

/**
 * Creates a new item on a Monday.com board
 *
 * @param input - Item creation parameters
 * @param config - Monday.com configuration
 * @returns Created item details
 * @throws Error if creation fails
 *
 * @example
 * ```typescript
 * const item = await createItem(
 *   {
 *     boardId: "1234567890",
 *     itemName: "John Doe",
 *     columnValues: {
 *       email: { email: "john@example.com", text: "john@example.com" },
 *       phone: { phone: "+1234567890" },
 *       numbers: 59.99
 *     }
 *   },
 *   { apiKey: process.env.MONDAY_API_KEY!, boardId: "1234567890" }
 * );
 * ```
 */
export async function createItem(
  input: CreateItemInput,
  config: MondayConfig
): Promise<CreatedItem> {
  // Validate input
  const validatedInput = CreateItemInputSchema.parse(input);

  const monday = getAxiosInstance(config);

  // Convert column values to JSON string as required by Monday API
  const columnValuesJson = validatedInput.columnValues
    ? JSON.stringify(validatedInput.columnValues)
    : undefined;

  const response = await monday.post<MondayAPIResponse<CreateItemResult>>("", {
    query: CREATE_ITEM_MUTATION,
    variables: {
      boardId: validatedInput.boardId,
      groupId: validatedInput.groupId || undefined,
      itemName: validatedInput.itemName,
      columnValues: columnValuesJson,
    },
  });

  if (response.data.errors && response.data.errors.length > 0) {
    const errorMessages = response.data.errors.map((e) => e.message).join("; ");
    throw new Error(`Monday.com createItem error: ${errorMessages}`);
  }

  const createdItem = response.data.data?.create_item;

  if (!createdItem) {
    throw new Error("Failed to create item - no item returned");
  }

  return createdItem;
}
