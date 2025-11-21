/**
 * Migration Controller - Migrate User
 *
 * Public endpoint to migrate a single user or all users from old database
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
import { azureBlobStorageService } from '../../../services/azure-blob-storage.service';

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
 * Migration result for each user
 */
interface MigrationResult {
  email: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  plan: string;
  workspaceCreated: boolean;
  workspaceId: number | null;
  emailSent: boolean;
  errorMessage: string;
  timestamp: string;
  userId?: number;
  temporaryPassword?: string;
}

/**
 * Upload CSV report to Azure Blob Storage
 */
async function uploadCSVToAzure(results: MigrationResult[]): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `migration-report-${timestamp}.csv`;

  // CSV Header
  const header = 'Email,Status,Plan,Workspace Created,Workspace ID,Email Sent,Error Message,Timestamp\n';

  // CSV Rows
  const rows = results.map(result => {
    return [
      result.email,
      result.status,
      result.plan,
      result.workspaceCreated ? 'Yes' : 'No',
      result.workspaceId || 'N/A',
      result.emailSent ? 'Yes' : 'No',
      `"${result.errorMessage.replace(/"/g, '""')}"`, // Escape quotes
      result.timestamp,
    ].join(',');
  }).join('\n');

  const csvContent = header + rows;
  const buffer = Buffer.from(csvContent, 'utf-8');

  // Upload to Azure Blob Storage
  const uploadResult = await azureBlobStorageService.uploadBuffer(buffer, {
    fileName,
    contentType: 'text/csv',
    folder: 'migration-reports',
  });

  return uploadResult.url;
}

/**
 * POST /api/migration/migrate-user
 *
 * Migrates a single user or all users from old database to new system
 *
 * @param req - Express request with email and/or allUsers in body
 * @param res - Express response
 */
export async function migrateUser(
  req: Request,
  res: Response
): Promise<Response<MigrateUserResponse>> {
  const migrationResults: MigrationResult[] = [];

  try {
    // 1. Validate request body
    const validatedData = migrateUserRequest.parse(req.body);
    const { email, allUsers } = validatedData;

    console.log('[Migration API] Starting migration - allUsers:', allUsers);

    // 2. Test old database connection
    try {
      await oldDbClient.$queryRaw`SELECT 1`;
      console.log('[Migration API] Old database connection successful');
    } catch (dbError: any) {
      console.error('[Migration API] Old database connection failed:', dbError);
      throw new Error(`Old database connection failed: ${dbError.message}`);
    }

    // 3. Determine which users to migrate
    let usersToMigrate: any[] = [];

    if (allUsers === true) {
      // Fetch ALL users from old database
      console.log('[Migration API] Fetching all users from old database');
      usersToMigrate = await oldDbClient.$queryRaw`
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
        ORDER BY id
      `;
      console.log(`[Migration API] Found ${usersToMigrate.length} users to migrate`);
    } else {
      // Fetch single user by email
      if (!email) {
        throw new BadRequestError('Email is required when allUsers is false');
      }

      console.log('[Migration API] Fetching user:', email);
      usersToMigrate = await oldDbClient.$queryRaw`
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

      if (usersToMigrate.length === 0) {
        throw new BadRequestError('User not found in old database');
      }
    }

    // 4. Process each user
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const userRaw of usersToMigrate) {
      const timestamp = new Date().toISOString();
      let result: MigrationResult = {
        email: userRaw.email || 'unknown',
        status: 'FAILED',
        plan: '',
        workspaceCreated: false,
        workspaceId: null,
        emailSent: false,
        errorMessage: '',
        timestamp,
      };

      try {
        // Validate old user data
        const oldUser: OldUserData = oldUserDataSchema.parse(userRaw);
        result.email = oldUser.email;

        console.log(`[Migration API] Processing user: ${oldUser.email}`);

        // Migrate user
        const migrationResult = await MigrateOldUserService.migrateUser(oldUser);

        // Update result based on migration outcome
        result.plan = migrationResult.plan;
        result.workspaceCreated = migrationResult.workspaceCreated || false;
        result.workspaceId = migrationResult.workspaceId || null;
        result.emailSent = migrationResult.emailSent || false;

        if (migrationResult.success) {
          if (migrationResult.message.includes('already exists')) {
            result.status = 'SKIPPED';
            result.errorMessage = migrationResult.message;
            skippedCount++;
          } else {
            result.status = 'SUCCESS';
            result.errorMessage = '';
            successCount++;
          }
        } else {
          result.status = 'FAILED';
          result.errorMessage = migrationResult.error || migrationResult.message;
          failedCount++;
        }

        // Add email error if present
        if (migrationResult.emailError) {
          result.errorMessage += ` | Email error: ${migrationResult.emailError}`;
        }

      } catch (userError: any) {
        console.error(`[Migration API] Error migrating user ${result.email}:`, userError);
        result.status = 'FAILED';
        result.errorMessage = userError.message || 'Unknown error occurred';
        failedCount++;
      }

      migrationResults.push(result);
      console.log(`[Migration API] User ${result.email}: ${result.status}`);
    }

    // 5. Upload CSV report to Azure Blob Storage
    const csvUrl = await uploadCSVToAzure(migrationResults);
    console.log(`[Migration API] CSV report uploaded to Azure: ${csvUrl}`);

    // 6. Return response
    const totalProcessed = migrationResults.length;
    const overallSuccess = failedCount === 0;

    // Return different response format based on single vs bulk migration
    if (allUsers) {
      // Bulk migration: concise response with CSV URL only
      return res.status(overallSuccess ? 200 : 207).json({
        success: overallSuccess,
        message: `Processed ${totalProcessed} users: ${successCount} succeeded, ${skippedCount} skipped, ${failedCount} failed`,
        csvReportUrl: csvUrl,
        totalProcessed,
        successCount,
        failedCount,
        skippedCount,
      });
    } else {
      // Single user migration: detailed response with user data
      return res.status(overallSuccess ? 200 : 207).json({
        success: overallSuccess,
        message: migrationResults[0]?.status === 'SUCCESS'
          ? 'User migrated successfully'
          : migrationResults[0]?.status === 'SKIPPED'
          ? 'User already exists'
          : 'Migration failed',
        csvReportUrl: csvUrl,
        data: migrationResults.length === 1 ? {
          email: migrationResults[0].email,
          plan: migrationResults[0].plan,
          workspaceCreated: migrationResults[0].workspaceCreated,
          workspaceId: migrationResults[0].workspaceId || undefined,
          emailSent: migrationResults[0].emailSent,
        } : undefined,
      });
    }

  } catch (error: any) {
    console.error('[Migration API] Error:', error);
    console.error('[Migration API] Request body:', req.body);

    // Upload CSV report even on error if we have any results
    let csvUrl: string | undefined;
    if (migrationResults.length > 0) {
      try {
        csvUrl = await uploadCSVToAzure(migrationResults);
        console.log(`[Migration API] CSV report uploaded to Azure (with errors): ${csvUrl}`);
      } catch (csvError) {
        console.error('[Migration API] Failed to upload CSV report to Azure:', csvError);
      }
    }

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
        csvReportUrl: csvUrl,
      });
    }

    if (error instanceof BadRequestError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: error.message,
        csvReportUrl: csvUrl,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message || 'Unknown error occurred',
      csvReportUrl: csvUrl,
    });
  }
}
