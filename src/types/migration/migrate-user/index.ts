/**
 * Type definitions for migration API endpoint
 *
 * @see ARCHITECTURE.md - Type safety requirements
 */

import { z } from 'zod';

/**
 * Request schema for migrating a single user or all users
 */
export const migrateUserRequest = z.object({
  email: z.string().email('Valid email is required').optional(),
  allUsers: z.boolean().optional().default(false),
});

export type MigrateUserRequest = z.infer<typeof migrateUserRequest>;

/**
 * Single user migration result
 */
export const userMigrationResult = z.object({
  email: z.string(),
  status: z.enum(['SUCCESS', 'FAILED', 'SKIPPED']),
  plan: z.string(),
  workspaceCreated: z.boolean(),
  workspaceId: z.number().nullable(),
  emailSent: z.boolean(),
  errorMessage: z.string(),
  timestamp: z.string(),
  userId: z.number().optional(),
  temporaryPassword: z.string().optional(),
});

export type UserMigrationResult = z.infer<typeof userMigrationResult>;

/**
 * Response schema for migration endpoint
 */
export const migrateUserResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z
    .object({
      userId: z.number().optional(),
      email: z.string(),
      plan: z.string(),
      workspaceCreated: z.boolean().optional(),
      workspaceId: z.number().optional(),
      temporaryPassword: z.string().optional(),
      emailSent: z.boolean().optional(),
    })
    .optional(),
  error: z.string().optional(),
  csvReportUrl: z.string().optional(),
  totalProcessed: z.number().optional(),
  successCount: z.number().optional(),
  failedCount: z.number().optional(),
  skippedCount: z.number().optional(),
  results: z.array(userMigrationResult).optional(),
});

export type MigrateUserResponse = z.infer<typeof migrateUserResponse>;
