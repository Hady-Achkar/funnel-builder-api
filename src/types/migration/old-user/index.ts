/**
 * Type definitions for old database user migration
 *
 * These types define the structure of user data from the old PostgreSQL database
 * and the migration result after processing
 *
 * @see ARCHITECTURE.md - Type safety requirements
 */

import { z } from 'zod';
import { UserPlan } from '../../../generated/prisma-client';

/**
 * Schema for old database user data from up_users table
 *
 * Lenient validation that focuses on essential fields only.
 * Non-essential fields are made optional with defaults to handle corrupted data.
 */
export const oldUserDataSchema = z.object({
  // Essential fields - strict validation
  id: z.number(),
  email: z.string().email(),
  created_at: z.date(),

  // User info fields - lenient (nullable)
  username: z.string().nullable().optional(),
  firstname: z.string().nullable().optional(),
  lastname: z.string().nullable().optional(),
  usertype: z.string().nullable().optional(), // 'Business Plan' or other plan names

  // Trial date - important but can be null
  trial_end_date: z.date().nullable().optional(),

  // Non-essential fields - very lenient, will use defaults if corrupted
  is_paid: z.boolean().nullable().optional().catch(null),
  stripe_customer_id: z.string().nullable().optional().catch(null),
  balance: z.coerce.number().nullable().optional().catch(null), // Coerce to number, fallback to null if invalid
  updated_at: z.date().nullable().optional().catch(null),
  maximum_funnels_allowed: z.coerce.number().nullable().optional().catch(null),
  maximum_subdomains_allowed: z.coerce.number().nullable().optional().catch(null),
  maximum_custom_domains_allowed: z.coerce.number().nullable().optional().catch(null),
  maximum_admins_allowed: z.coerce.number().nullable().optional().catch(null),
});

/**
 * Type for old user data
 */
export type OldUserData = z.infer<typeof oldUserDataSchema>;

/**
 * Migration result returned after processing a user
 */
export interface MigrationResult {
  success: boolean;
  userId?: number;
  email: string;
  plan: UserPlan;
  message: string;
  error?: string;
  workspaceCreated?: boolean;
  workspaceId?: number;
  temporaryPassword?: string;
  emailSent?: boolean;
  emailError?: string;
}

/**
 * Migration statistics for batch operations
 */
export interface MigrationStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  oldMemberCount: number;
  businessCount: number;
  errors: Array<{
    email: string;
    error: string;
  }>;
}
