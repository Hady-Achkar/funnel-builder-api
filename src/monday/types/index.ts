import { z } from "zod";

/**
 * Monday.com API Types
 * Centralized type definitions for all Monday.com API operations
 */

// ============================================================================
// Configuration Schemas
// ============================================================================

export const MondayConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  boardId: z.string().min(1, "Board ID is required"),
  groupId: z.string().optional(),
});

// ============================================================================
// GraphQL Response Schemas
// ============================================================================

export const MondayErrorSchema = z.object({
  message: z.string(),
  locations: z
    .array(
      z.object({
        line: z.number(),
        column: z.number(),
      })
    )
    .optional(),
  path: z.array(z.string()).optional(),
  extensions: z.record(z.string(), z.any()).optional(),
});

export const MondayAPIResponseSchema = z.object({
  data: z.any().nullable(),
  errors: z.array(MondayErrorSchema).optional(),
  account_id: z.number().optional(),
});

// ============================================================================
// Board Schemas
// ============================================================================

export const BoardColumnSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
});

export const BoardSchema = z.object({
  id: z.string(),
  name: z.string(),
  columns: z.array(BoardColumnSchema),
});

export const GetBoardResultSchema = z.object({
  boards: z.array(BoardSchema),
});

// ============================================================================
// Item Schemas
// ============================================================================

export const CreateItemInputSchema = z.object({
  boardId: z.string().min(1),
  groupId: z.string().optional(),
  itemName: z.string().min(1),
  columnValues: z.record(z.string(), z.unknown()).optional(),
});

export const CreatedItemSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const CreateItemResultSchema = z.object({
  create_item: CreatedItemSchema,
});

// ============================================================================
// Partner Registration Schema
// ============================================================================

export const PartnerRegistrationDataSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  transactionId: z.string(),
  amount: z.number(),
  currency: z.string(),
  isNewUser: z.boolean(),
  createdAt: z.string(),
});

// ============================================================================
// Type Definitions (z.infer)
// ============================================================================

// Configuration Types
export type MondayConfig = z.infer<typeof MondayConfigSchema>;

// GraphQL Response Types
export type MondayError = z.infer<typeof MondayErrorSchema>;
export type MondayAPIResponse<T = unknown> = {
  data: T | null;
  errors?: MondayError[];
  account_id?: number;
};

// Board Types
export type BoardColumn = z.infer<typeof BoardColumnSchema>;
export type Board = z.infer<typeof BoardSchema>;
export type GetBoardResult = z.infer<typeof GetBoardResultSchema>;

// Item Types
export type CreateItemInput = z.infer<typeof CreateItemInputSchema>;
export type CreatedItem = z.infer<typeof CreatedItemSchema>;
export type CreateItemResult = z.infer<typeof CreateItemResultSchema>;

// Partner Registration Types
export type PartnerRegistrationData = z.infer<
  typeof PartnerRegistrationDataSchema
>;
