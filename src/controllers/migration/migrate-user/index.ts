/**
 * Migration Controller - Migrate User
 *
 * Public endpoint to migrate a single user from old database
 *
 * @see ARCHITECTURE.md - Controller patterns
 */

import { Request, Response } from 'express';
import { PrismaClient } from '../../../generated/prisma-client';
import { MigrateOldUserService } from '../../../services/migration/old-user';
import {
  migrateUserRequest,
  MigrateUserResponse,
} from '../../../types/migration/migrate-user';
import { oldUserDataSchema, OldUserData } from '../../../types/migration/old-user';
import { BadRequestError } from '../../../errors/http-errors';

// Old database client
const oldDbClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.OLD_DATABASE_URL ||
        'postgresql://digitalsite_admin:Test%401234%23@digitalsite-prod-db.postgres.database.azure.com:5432/postgres?sslmode=require',
    },
  },
});

/**
 * POST /api/migration/migrate-user
 *
 * Migrates a single user from old database to new system
 *
 * @param req - Express request with email in body
 * @param res - Express response
 */
export async function migrateUser(
  req: Request,
  res: Response
): Promise<Response<MigrateUserResponse>> {
  try {
    // 1. Validate request body
    const validatedData = migrateUserRequest.parse(req.body);
    const { email } = validatedData;

    console.log('[Migration API] Starting migration for:', email);

    // 2. Test old database connection
    try {
      await oldDbClient.$queryRaw`SELECT 1`;
      console.log('[Migration API] Old database connection successful');
    } catch (dbError: any) {
      console.error('[Migration API] Old database connection failed:', dbError);
      throw new Error(`Old database connection failed: ${dbError.message}`);
    }

    // 3. Fetch user from old database (with parameterized query to prevent SQL injection)
    const oldUserRaw: any[] = await oldDbClient.$queryRaw`
      SELECT
        id,
        username,
        email,
        firstname,
        lastname,
        usertype,
        is_paid,
        stripe_customer_id,
        balance,
        created_at,
        updated_at,
        trial_end_date,
        maximum_funnels_allowed,
        maximum_subdomains_allowed,
        maximum_custom_domains_allowed,
        maximum_admins_allowed
      FROM up_users
      WHERE email = ${email}
      LIMIT 1
    `;

    console.log('[Migration API] Query result:', oldUserRaw.length, 'rows');

    if (oldUserRaw.length === 0) {
      throw new BadRequestError('User not found in old database');
    }

    // 3. Validate old user data
    const oldUser: OldUserData = oldUserDataSchema.parse(oldUserRaw[0]);

    // 4. Migrate user
    const migrationResult = await MigrateOldUserService.migrateUser(oldUser);

    // 5. Return response
    if (migrationResult.success) {
      return res.status(200).json({
        success: true,
        message: migrationResult.message,
        data: {
          userId: migrationResult.userId,
          email: migrationResult.email,
          plan: migrationResult.plan,
          workspaceCreated: migrationResult.workspaceCreated,
          workspaceId: migrationResult.workspaceId,
          temporaryPassword: migrationResult.temporaryPassword,
          emailSent: migrationResult.emailSent,
          emailError: migrationResult.emailError,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: migrationResult.message,
        error: migrationResult.error,
        data: {
          email: migrationResult.email,
          plan: migrationResult.plan,
        },
      });
    }
  } catch (error: any) {
    console.error('[Migration API] Error:', error);
    console.error('[Migration API] Request body:', req.body);

    if (error.name === 'ZodError') {
      const zodErrors = error.errors?.map((e: any) => ({
        path: e.path.join('.'),
        message: e.message,
      })) || [];

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.errors?.[0]?.message || 'Invalid request data',
        validationErrors: zodErrors,
      });
    }

    if (error instanceof BadRequestError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message || 'Unknown error occurred',
    });
  }
}
