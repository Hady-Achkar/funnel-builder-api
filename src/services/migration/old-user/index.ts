/**
 * Old User Migration Service
 *
 * Migrates users from old PostgreSQL database (up_users table) to new system
 * Supports two user types:
 * - OLD_MEMBER: Users get OLD_MEMBER plan + protected workspace
 * - Business Plan: Users get BUSINESS plan (no protected workspace)
 *
 * @see ARCHITECTURE.md - Service layer patterns
 */

import { getPrisma } from '../../../lib/prisma';
import { UserPlan, RegistrationSource } from '../../../generated/prisma-client';
import bcrypt from 'bcryptjs';
import sgMail from '@sendgrid/mail';

import {
  OldUserData,
  MigrationResult,
} from '../../../types/migration/old-user';
import { generateTempPassword } from './utils/generate-temp-password';
import { calculateTrialDates } from './utils/calculate-trial-dates';
import { createProtectedWorkspace } from './utils/create-protected-workspace';
import {
  getOldMemberWelcomeEmailHtml,
  getOldMemberWelcomeEmailText,
} from '../../../constants/emails/migration/old-member-welcome';
import {
  getBusinessWelcomeEmailHtml,
  getBusinessWelcomeEmailText,
} from '../../../constants/emails/migration/business-welcome';

/**
 * Old User Migration Service
 */
export class MigrateOldUserService {
  /**
   * Migrates a single user from old database to new system
   *
   * Steps:
   * 1. Check if user already exists (skip if yes)
   * 2. Determine user plan (OLD_MEMBER or BUSINESS based on usertype)
   * 3. Generate temporary password
   * 4. Calculate trial dates
   * 5. Create user + workspace (if OLD_MEMBER) in transaction
   * 6. Send welcome email (non-blocking)
   *
   * @param oldUserData - User data from old database
   * @returns Migration result
   */
  static async migrateUser(
    oldUserData: OldUserData
  ): Promise<MigrationResult> {
    try {
      const prisma = getPrisma();

      // 1. Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: oldUserData.email },
      });

      if (existingUser) {
        return {
          success: false,
          email: oldUserData.email,
          plan: existingUser.plan,
          message: 'User already exists (skipped)',
        };
      }

      // 2. Determine user plan based on old usertype
      const isBusinessUser =
        oldUserData.usertype?.toLowerCase() === 'business plan';
      const userPlan = isBusinessUser ? UserPlan.BUSINESS : UserPlan.OLD_MEMBER;

      // 3. Generate temporary password
      const temporaryPassword = generateTempPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      // 4. Calculate trial dates
      const { trialStartDate, trialEndDate } = calculateTrialDates(oldUserData);

      // 5. Prepare user data
      const firstName = oldUserData.firstname || 'User';
      const lastName = oldUserData.lastname || '';
      const username =
        oldUserData.username || oldUserData.email.split('@')[0];

      // 6. Create user (+ workspace for OLD_MEMBER) in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            email: oldUserData.email,
            username,
            firstName,
            lastName,
            password: hashedPassword,
            verified: true, // Pre-verified (no verification email needed)
            isAdmin: false,
            plan: userPlan,
            registrationSource: RegistrationSource.DIRECT,
            balance: 0,
            trialStartDate,
            trialEndDate,
          },
        });

        let workspaceId: number | undefined;
        let workspaceCreated = false;

        // Create protected workspace only for OLD_MEMBER users
        if (userPlan === UserPlan.OLD_MEMBER) {
          const workspaceResult = await createProtectedWorkspace({
            userId: newUser.id,
            userEmail: newUser.email,
            firstName: newUser.firstName,
            tx, // Pass transaction to ensure workspace creation is in same transaction
          });

          workspaceId = workspaceResult.workspaceId;
          workspaceCreated = true;
        }

        return {
          user: newUser,
          workspaceId,
          workspaceCreated,
        };
      });

      // 7. Send welcome email (make it synchronous to catch errors)
      console.log(`[Migration] Attempting to send welcome email to ${oldUserData.email}...`);
      let emailSent = false;
      let emailError: string | undefined;

      try {
        await this.sendWelcomeEmail(
          userPlan,
          oldUserData.email,
          firstName,
          temporaryPassword,
          trialEndDate
        );
        emailSent = true;
        console.log(`[Migration] Email sent successfully to ${oldUserData.email}`);
      } catch (error: any) {
        console.error(
          `[Migration] Failed to send welcome email to ${oldUserData.email}:`,
          error
        );
        console.error('[Migration] Error message:', error?.message);
        console.error('[Migration] Error response:', error?.response?.body);
        emailError = error?.message || 'Unknown email error';
      }

      return {
        success: true,
        userId: result.user.id,
        email: oldUserData.email,
        plan: userPlan,
        message: `User migrated successfully as ${userPlan}${emailSent ? ' (email sent)' : ' (email failed)'}`,
        workspaceCreated: result.workspaceCreated,
        workspaceId: result.workspaceId,
        temporaryPassword, // Include for logging/verification
        emailSent,
        emailError,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        email: oldUserData.email,
        plan: UserPlan.OLD_MEMBER, // Default for error reporting
        message: 'Migration failed',
        error: errorMessage,
      };
    }
  }

  /**
   * Sends welcome email based on user plan type
   *
   * @param plan - User plan (OLD_MEMBER or BUSINESS)
   * @param email - User email address
   * @param firstName - User first name
   * @param temporaryPassword - Generated temporary password
   * @param trialEndDate - Trial end date
   */
  private static async sendWelcomeEmail(
    plan: UserPlan,
    email: string,
    firstName: string,
    temporaryPassword: string,
    trialEndDate: Date
  ): Promise<void> {
    console.log(`[Migration Email] Starting email send for ${email}, plan: ${plan}`);

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('[Migration Email] SENDGRID_API_KEY is not configured');
      throw new Error('SENDGRID_API_KEY is not configured');
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (!fromEmail) {
      console.error('[Migration Email] SENDGRID_FROM_EMAIL is not configured');
      throw new Error('SENDGRID_FROM_EMAIL is not configured');
    }

    console.log(`[Migration Email] SendGrid configured, from: ${fromEmail}`);
    sgMail.setApiKey(apiKey);

    const emailData = {
      firstName,
      email,
      temporaryPassword,
      trialEndDate,
    };

    let htmlContent: string;
    let textContent: string;
    let subject: string;

    console.log(`[Migration Email] Generating email content for plan: ${plan}`);
    if (plan === UserPlan.BUSINESS) {
      htmlContent = getBusinessWelcomeEmailHtml(emailData);
      textContent = getBusinessWelcomeEmailText(emailData);
      subject = 'Welcome to the New Digitalsite | مرحبًا بك في Digitalsite الجديد';
    } else {
      // OLD_MEMBER
      htmlContent = getOldMemberWelcomeEmailHtml(emailData);
      textContent = getOldMemberWelcomeEmailText(emailData);
      subject = 'Welcome to the New Digitalsite | مرحبًا بك في Digitalsite الجديد';
    }

    console.log(`[Migration Email] Sending email via SendGrid to ${email}...`);
    const result = await sgMail.send({
      to: email,
      from: {
        email: fromEmail,
        name: 'Digitalsite',
      },
      subject,
      html: htmlContent,
      text: textContent,
    });

    console.log(`[Migration Email] SendGrid response:`, result);
    console.log(`[Migration Email] Welcome email sent successfully to ${email} (${plan})`);
  }
}
