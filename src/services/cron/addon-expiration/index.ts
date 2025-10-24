import { getPrisma } from "../../../lib/prisma";
import {
  AddonExpirationSummary,
  EmailReminderSummary,
  ExpiredAddonResult,
  EmailReminderResult,
  ExpirationReminders,
  ExpirationMarkingSummary,
  ExpiredSubscriptionResult,
  ExpiredAddonMarkResult,
} from "../../../types/cron/addon-expiration.types";
import { AddOn, AddOnType } from "../../../generated/prisma-client";
import { WorkspaceExpirationHandler } from "./handlers/workspace-handler";
import { DomainExpirationHandler } from "./handlers/domain-handler";
import { PageExpirationHandler } from "./handlers/page-handler";
import { FunnelExpirationHandler } from "./handlers/funnel-handler";
import { MemberExpirationHandler } from "./handlers/member-handler";
import sgMail from "@sendgrid/mail";
import {
  getAddonWarning7DaysEmailHtml,
  getAddonWarning7DaysEmailText,
  AddonWarning7DaysData,
} from "../../../constants/emails/addon/expiration-warning-7days";
import {
  getAddonWarning3DaysEmailHtml,
  getAddonWarning3DaysEmailText,
  AddonWarning3DaysData,
} from "../../../constants/emails/addon/expiration-warning-3days";
import {
  getAddonWarning1DayEmailHtml,
  getAddonWarning1DayEmailText,
  AddonWarning1DayData,
} from "../../../constants/emails/addon/expiration-warning-1day";
import {
  getAddonExpiredEmailHtml,
  getAddonExpiredEmailText,
  AddonExpiredData,
} from "../../../constants/emails/addon/expired";

/**
 * Addon Expiration Service
 *
 * Handles two main tasks:
 * 1. Send warning emails (7, 3, 1 day before expiration)
 * 2. Process expired addons (disable extra resources)
 */
export class AddonExpirationService {
  /**
   * Send warning emails for addons expiring soon
   * Runs daily to check for addons expiring in 7, 3, or 1 day
   */
  static async sendWarningEmails(): Promise<EmailReminderSummary> {
    const startTime = Date.now();
    const prisma = getPrisma();

    console.log("[AddonExpiration] Starting warning email check...");

    const results: EmailReminderResult[] = [];
    const errors: Array<{ addonId: number; error: string }> = [];
    let day7Sent = 0;
    let day3Sent = 0;
    let day1Sent = 0;

    try {
      const now = new Date();
      const eightDaysFromNow = new Date(now);
      eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);

      // Find addons expiring within next 8 days
      // Only process non-ACTIVE addons (CANCELLED, etc.) - ACTIVE means renewed/ongoing
      const upcomingExpirations = await prisma.addOn.findMany({
        where: {
          status: { not: "ACTIVE" }, // Skip ACTIVE addons (renewed/ongoing subscriptions)
          endDate: {
            not: null,
            gte: now,
            lte: eightDaysFromNow,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      console.log(
        `[AddonExpiration] Found ${upcomingExpirations.length} addons expiring soon`
      );

      for (const addon of upcomingExpirations) {
        if (!addon.endDate || !addon.user) continue;

        // Calculate days until expiration using day boundaries (not exact hours)
        // Set both dates to midnight for accurate day counting
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const expirationMidnight = new Date(
          addon.endDate.getFullYear(),
          addon.endDate.getMonth(),
          addon.endDate.getDate()
        );
        const daysUntilExpiration = Math.round(
          (expirationMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Parse existing reminders
        const reminders = (addon.expirationReminders as ExpirationReminders) || {};

        // Determine which email to send
        // Use ranges to catch addons that might have been created between cron runs
        let shouldSend = false;
        let reminderType: "day7" | "day3" | "day1" | null = null;

        if (daysUntilExpiration >= 6 && daysUntilExpiration <= 8 && !reminders.day7) {
          // Send 7-day warning for addons expiring in 6-8 days
          shouldSend = true;
          reminderType = "day7";
        } else if (daysUntilExpiration >= 2 && daysUntilExpiration <= 4 && !reminders.day3) {
          // Send 3-day warning for addons expiring in 2-4 days
          shouldSend = true;
          reminderType = "day3";
        } else if (daysUntilExpiration >= 0 && daysUntilExpiration <= 2 && !reminders.day1) {
          // Send 1-day warning for addons expiring in 0-2 days
          shouldSend = true;
          reminderType = "day1";
        }

        if (!shouldSend || !reminderType) {
          continue; // Skip if no email needs to be sent
        }

        try {
          // Send the appropriate warning email
          await this.sendWarningEmail(addon, reminderType);

          // Update reminder tracking
          const updatedReminders = {
            ...reminders,
            [reminderType]: true,
          };

          await prisma.addOn.update({
            where: { id: addon.id },
            data: { expirationReminders: updatedReminders },
          });

          results.push({
            addonId: addon.id,
            addonType: addon.type,
            userId: addon.userId,
            userEmail: addon.user.email,
            daysUntilExpiration,
            emailSent: true,
          });

          if (reminderType === "day7") day7Sent++;
          if (reminderType === "day3") day3Sent++;
          if (reminderType === "day1") day1Sent++;

          console.log(
            `[AddonExpiration] ✅ Sent ${reminderType} warning email for addon ${addon.id} to ${addon.user.email}`
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(
            `[AddonExpiration] Failed to send warning for addon ${addon.id}:`,
            errorMessage
          );

          results.push({
            addonId: addon.id,
            addonType: addon.type,
            userId: addon.userId,
            userEmail: addon.user.email,
            daysUntilExpiration,
            emailSent: false,
            error: errorMessage,
          });

          errors.push({
            addonId: addon.id,
            error: errorMessage,
          });
        }
      }

      const executionTime = Date.now() - startTime;

      console.log(
        `[AddonExpiration] Warning emails completed: ${day7Sent} (7-day) + ${day3Sent} (3-day) + ${day1Sent} (1-day) = ${day7Sent + day3Sent + day1Sent} total`
      );

      return {
        success: errors.length === 0,
        totalEligible: upcomingExpirations.length,
        day7Sent,
        day3Sent,
        day1Sent,
        totalFailed: errors.length,
        results,
        errors,
        executionTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[AddonExpiration] Fatal error in sendWarningEmails:", errorMessage);

      return {
        success: false,
        totalEligible: 0,
        day7Sent,
        day3Sent,
        day1Sent,
        totalFailed: 1,
        results,
        errors: [{ addonId: 0, error: errorMessage }],
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Helper: Send warning email based on days until expiration
   */
  private static async sendWarningEmail(
    addon: AddOn & { user: { email: string; firstName: string | null } },
    reminderType: "day7" | "day3" | "day1"
  ): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      throw new Error("SendGrid not configured");
    }

    sgMail.setApiKey(apiKey);

    const addonTypeName = this.getAddonTypeFriendlyName(addon.type);
    const whatWillHappen = this.getWhatWillHappenText(addon.type);
    const whatWillHappenArabic = this.getWhatWillHappenTextArabic(addon.type);
    const renewalUrl = `${process.env.FRONTEND_URL}/dashboard/billing/addons`;

    const baseData = {
      recipientName: addon.user.firstName || "User",
      addonTypeName,
      quantity: addon.quantity,
      expirationDate: addon.endDate!,
      whatWillHappen,
      whatWillHappenArabic,
      renewalUrl,
    };

    let html: string;
    let text: string;
    let subject: string;

    if (reminderType === "day7") {
      html = getAddonWarning7DaysEmailHtml(baseData as AddonWarning7DaysData);
      text = getAddonWarning7DaysEmailText(baseData as AddonWarning7DaysData);
      subject = "Addon Expiring in 7 Days | تنتهي الإضافة خلال 7 أيام";
    } else if (reminderType === "day3") {
      html = getAddonWarning3DaysEmailHtml(baseData as AddonWarning3DaysData);
      text = getAddonWarning3DaysEmailText(baseData as AddonWarning3DaysData);
      subject = "Urgent: Addon Expiring in 3 Days | عاجل: تنتهي الإضافة خلال 3 أيام";
    } else {
      html = getAddonWarning1DayEmailHtml(baseData as AddonWarning1DayData);
      text = getAddonWarning1DayEmailText(baseData as AddonWarning1DayData);
      subject = "Final Warning: Addon Expires Tomorrow | تحذير أخير: تنتهي الإضافة غدًا";
    }

    await sgMail.send({
      to: addon.user.email,
      from: {
        email: fromEmail,
        name: "Digitalsite",
      },
      subject,
      html,
      text,
    });
  }

  /**
   * Process expired addons and disable resources
   * Runs daily to find and process addons that have expired
   */
  static async processExpiredAddons(): Promise<AddonExpirationSummary> {
    const startTime = Date.now();
    const prisma = getPrisma();

    console.log("[AddonExpiration] Starting addon expiration processing...");

    const results: ExpiredAddonResult[] = [];
    const errors: Array<{ addonId: number; error: string }> = [];

    try {
      const now = new Date();

      // Find expired addons that need resource processing
      // Process addons with status EXPIRED that haven't had resources processed yet
      const expiredAddons = await prisma.addOn.findMany({
        where: {
          endDate: {
            not: null,
            lt: now,
          },
          status: "EXPIRED", // Only process EXPIRED addons
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      console.log(
        `[AddonExpiration] Found ${expiredAddons.length} expired addons to process`
      );

      for (const addon of expiredAddons) {
        try {
          // Check if resources already processed
          const reminders = (addon.expirationReminders as ExpirationReminders) || {};
          if (reminders.resourcesProcessed) {
            console.log(
              `[AddonExpiration] ⏭️  Skipping addon ${addon.id} - resources already processed`
            );
            continue;
          }

          console.log(
            `[AddonExpiration] Processing expired addon ${addon.id} (type: ${addon.type}, workspace: ${addon.workspaceId})`
          );

          // Process addon based on type
          const handlerResult = await this.processAddonExpiration(addon);

          // Mark resources as processed
          const updatedReminders = {
            ...reminders,
            resourcesProcessed: true,
          };

          await prisma.addOn.update({
            where: { id: addon.id },
            data: {
              expirationReminders: updatedReminders,
              updatedAt: new Date(),
            },
          });

          // Send expiration confirmation email
          if (addon.user) {
            try {
              await this.sendExpirationConfirmationEmail(addon, handlerResult);
            } catch (emailError) {
              console.error(
                `[AddonExpiration] Failed to send expiration email for addon ${addon.id}:`,
                emailError
              );
            }
          }

          results.push({
            addonId: addon.id,
            addonType: addon.type,
            userId: addon.userId,
            workspaceId: addon.workspaceId,
            success: handlerResult.success,
            resourcesAffected: handlerResult.resourcesAffected,
            error: handlerResult.error,
          });

          console.log(
            `[AddonExpiration] ✅ Processed addon ${addon.id}: ${JSON.stringify(handlerResult.resourcesAffected)}`
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(
            `[AddonExpiration] Failed to process addon ${addon.id}:`,
            errorMessage
          );

          results.push({
            addonId: addon.id,
            addonType: addon.type,
            userId: addon.userId,
            workspaceId: addon.workspaceId,
            success: false,
            resourcesAffected: {},
            error: errorMessage,
          });

          errors.push({
            addonId: addon.id,
            error: errorMessage,
          });
        }
      }

      const totalProcessed = results.filter((r) => r.success).length;
      const executionTime = Date.now() - startTime;

      console.log(
        `[AddonExpiration] Completed: ${totalProcessed}/${expiredAddons.length} addons processed successfully`
      );

      return {
        success: errors.length === 0,
        totalExpired: expiredAddons.length,
        totalProcessed,
        totalFailed: errors.length,
        results,
        errors,
        executionTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        "[AddonExpiration] Fatal error in processExpiredAddons:",
        errorMessage
      );

      return {
        success: false,
        totalExpired: 0,
        totalProcessed: 0,
        totalFailed: 1,
        results,
        errors: [{ addonId: 0, error: errorMessage }],
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Route addon to appropriate handler based on type
   */
  private static async processAddonExpiration(addon: AddOn) {
    switch (addon.type) {
      case AddOnType.EXTRA_WORKSPACE:
        return await WorkspaceExpirationHandler.handle(addon);

      case AddOnType.EXTRA_SUBDOMAIN:
      case AddOnType.EXTRA_CUSTOM_DOMAIN:
        return await DomainExpirationHandler.handle(addon);

      case AddOnType.EXTRA_PAGE:
        return await PageExpirationHandler.handle(addon);

      case AddOnType.EXTRA_FUNNEL:
        return await FunnelExpirationHandler.handle(addon);

      case AddOnType.EXTRA_ADMIN:
        return await MemberExpirationHandler.handle(addon);

      default:
        return {
          success: false,
          resourcesAffected: {},
          error: `Unknown addon type: ${addon.type}`,
        };
    }
  }

  /**
   * Send expiration confirmation email
   */
  private static async sendExpirationConfirmationEmail(
    addon: AddOn & { user: { email: string; firstName: string | null } },
    handlerResult: any
  ): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      return; // Don't throw, just skip email
    }

    sgMail.setApiKey(apiKey);

    const addonTypeName = this.getAddonTypeFriendlyName(addon.type);
    const whatHappened = this.getWhatHappenedText(
      addon.type,
      handlerResult.resourcesAffected
    );
    const whatHappenedArabic = this.getWhatHappenedTextArabic(
      addon.type,
      handlerResult.resourcesAffected
    );
    const renewalUrl = `${process.env.FRONTEND_URL}/dashboard/billing/addons`;

    const emailData: AddonExpiredData = {
      recipientName: addon.user.firstName || "User",
      addonTypeName,
      quantity: addon.quantity,
      expirationDate: addon.endDate!,
      whatHappened,
      whatHappenedArabic,
      renewalUrl,
    };

    await sgMail.send({
      to: addon.user.email,
      from: {
        email: fromEmail,
        name: "Digitalsite",
      },
      subject: "Addon Expired | انتهت صلاحية الإضافة",
      html: getAddonExpiredEmailHtml(emailData),
      text: getAddonExpiredEmailText(emailData),
    });
  }

  /**
   * Helper: Get user-friendly addon type name
   */
  private static getAddonTypeFriendlyName(type: AddOnType): string {
    const names: Record<AddOnType, string> = {
      [AddOnType.EXTRA_WORKSPACE]: "Extra Workspace",
      [AddOnType.EXTRA_FUNNEL]: "Extra Website",
      [AddOnType.EXTRA_PAGE]: "Extra Page",
      [AddOnType.EXTRA_SUBDOMAIN]: "Extra Subdomain",
      [AddOnType.EXTRA_CUSTOM_DOMAIN]: "Extra Custom Domain",
      [AddOnType.EXTRA_ADMIN]: "Extra Admin",
    };
    return names[type] || type;
  }

  /**
   * Helper: Get description of what will happen when addon expires (English)
   */
  private static getWhatWillHappenText(type: AddOnType): string {
    const texts: Record<AddOnType, string> = {
      [AddOnType.EXTRA_WORKSPACE]:
        "The extra workspace and all its websites will be disabled.",
      [AddOnType.EXTRA_FUNNEL]:
        "Excess websites beyond your plan limit will be archived.",
      [AddOnType.EXTRA_PAGE]:
        "Excess pages beyond your plan limit will have their linking IDs removed.",
      [AddOnType.EXTRA_SUBDOMAIN]:
        "Excess subdomains beyond your plan limit will be deleted.",
      [AddOnType.EXTRA_CUSTOM_DOMAIN]:
        "Excess custom domains beyond your plan limit will be deleted.",
      [AddOnType.EXTRA_ADMIN]:
        "Excess team members beyond your plan limit will be removed.",
    };
    return texts[type] || "Resources will be adjusted to match your plan limits.";
  }

  /**
   * Helper: Get description of what will happen when addon expires (Arabic)
   */
  private static getWhatWillHappenTextArabic(type: AddOnType): string {
    const texts: Record<AddOnType, string> = {
      [AddOnType.EXTRA_WORKSPACE]:
        "سيتم تعطيل مساحة العمل الإضافية وجميع مواقعها.",
      [AddOnType.EXTRA_FUNNEL]:
        "سيتم أرشفة المواقع الزائدة عن حد خطتك.",
      [AddOnType.EXTRA_PAGE]:
        "سيتم إزالة معرفات الربط من الصفحات الزائدة عن حد خطتك.",
      [AddOnType.EXTRA_SUBDOMAIN]:
        "سيتم حذف النطاقات الفرعية الزائدة عن حد خطتك.",
      [AddOnType.EXTRA_CUSTOM_DOMAIN]:
        "سيتم حذف النطاقات المخصصة الزائدة عن حد خطتك.",
      [AddOnType.EXTRA_ADMIN]:
        "سيتم إزالة أعضاء الفريق الزائدين عن حد خطتك.",
    };
    return texts[type] || "سيتم تعديل الموارد لتتناسب مع حدود خطتك.";
  }

  /**
   * Helper: Get description of what happened after addon expired (English)
   */
  private static getWhatHappenedText(
    type: AddOnType,
    resourcesAffected: any
  ): string {
    const workspace = resourcesAffected.workspaces || 0;
    const funnels = resourcesAffected.funnels || 0;
    const pages = resourcesAffected.pages || 0;
    const domains = resourcesAffected.domains || 0;
    const members = resourcesAffected.members || 0;

    if (type === AddOnType.EXTRA_WORKSPACE) {
      return `${workspace} workspace and ${funnels} websites have been disabled.`;
    } else if (type === AddOnType.EXTRA_FUNNEL) {
      return `${funnels} excess websites have been archived.`;
    } else if (type === AddOnType.EXTRA_PAGE) {
      return `${pages} excess pages have had their linking IDs removed.`;
    } else if (
      type === AddOnType.EXTRA_SUBDOMAIN ||
      type === AddOnType.EXTRA_CUSTOM_DOMAIN
    ) {
      return `${domains} excess domains have been deleted.`;
    } else if (type === AddOnType.EXTRA_ADMIN) {
      return `${members} excess team members have been removed.`;
    }

    return "Your account has been adjusted to match your plan limits.";
  }

  /**
   * Helper: Get description of what happened after addon expired (Arabic)
   */
  private static getWhatHappenedTextArabic(
    type: AddOnType,
    resourcesAffected: any
  ): string {
    const workspace = resourcesAffected.workspaces || 0;
    const funnels = resourcesAffected.funnels || 0;
    const pages = resourcesAffected.pages || 0;
    const domains = resourcesAffected.domains || 0;
    const members = resourcesAffected.members || 0;

    if (type === AddOnType.EXTRA_WORKSPACE) {
      return `تم تعطيل ${workspace} مساحة عمل و ${funnels} موقع.`;
    } else if (type === AddOnType.EXTRA_FUNNEL) {
      return `تم أرشفة ${funnels} موقع زائد.`;
    } else if (type === AddOnType.EXTRA_PAGE) {
      return `تمت إزالة معرفات الربط من ${pages} صفحة زائدة.`;
    } else if (
      type === AddOnType.EXTRA_SUBDOMAIN ||
      type === AddOnType.EXTRA_CUSTOM_DOMAIN
    ) {
      return `تم حذف ${domains} نطاق زائد.`;
    } else if (type === AddOnType.EXTRA_ADMIN) {
      return `تم إزالة ${members} عضو فريق زائد.`;
    }

    return "تم تعديل حسابك ليتناسب مع حدود خطتك.";
  }

  /**
   * Mark expired subscriptions and addons as EXPIRED
   * This runs separately from resource processing to ensure all past-due items are marked
   */
  static async markExpiredItems(): Promise<ExpirationMarkingSummary> {
    const startTime = Date.now();
    const prisma = getPrisma();

    console.log("[AddonExpiration] Starting expiration marking check...");

    const subscriptionResults: ExpiredSubscriptionResult[] = [];
    const addonResults: ExpiredAddonMarkResult[] = [];
    const errors: Array<{ id: number; type: "subscription" | "addon"; error: string }> = [];

    try {
      const now = new Date();

      // 1. Mark expired subscriptions
      const expiredSubscriptions = await prisma.subscription.findMany({
        where: {
          endsAt: {
            lt: now,
          },
          status: { not: "EXPIRED" },
        },
      });

      console.log(
        `[AddonExpiration] Found ${expiredSubscriptions.length} subscriptions to mark as EXPIRED`
      );

      for (const subscription of expiredSubscriptions) {
        try {
          const previousStatus = subscription.status;

          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "EXPIRED" },
          });

          subscriptionResults.push({
            subscriptionId: subscription.id,
            userId: subscription.userId || 0,
            planType: subscription.subscriptionType || subscription.addonType || "NONE",
            previousStatus,
            endDate: subscription.endsAt,
            success: true,
          });

          console.log(
            `[AddonExpiration] ✅ Marked subscription ${subscription.id} as EXPIRED (was ${previousStatus})`
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          subscriptionResults.push({
            subscriptionId: subscription.id,
            userId: subscription.userId || 0,
            planType: subscription.subscriptionType || subscription.addonType || "NONE",
            previousStatus: subscription.status,
            endDate: subscription.endsAt,
            success: false,
            error: errorMessage,
          });

          errors.push({
            id: subscription.id,
            type: "subscription",
            error: errorMessage,
          });

          console.error(
            `[AddonExpiration] ❌ Failed to mark subscription ${subscription.id}:`,
            errorMessage
          );
        }
      }

      // 2. Mark expired addons
      const expiredAddons = await prisma.addOn.findMany({
        where: {
          endDate: {
            not: null,
            lt: now,
          },
          status: { not: "EXPIRED" },
        },
      });

      console.log(
        `[AddonExpiration] Found ${expiredAddons.length} addons to mark as EXPIRED`
      );

      for (const addon of expiredAddons) {
        try {
          const previousStatus = addon.status;

          await prisma.addOn.update({
            where: { id: addon.id },
            data: { status: "EXPIRED" },
          });

          addonResults.push({
            addonId: addon.id,
            addonType: addon.type,
            userId: addon.userId,
            workspaceId: addon.workspaceId,
            previousStatus,
            endDate: addon.endDate!,
            success: true,
          });

          console.log(
            `[AddonExpiration] ✅ Marked addon ${addon.id} (${addon.type}) as EXPIRED (was ${previousStatus})`
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          addonResults.push({
            addonId: addon.id,
            addonType: addon.type,
            userId: addon.userId,
            workspaceId: addon.workspaceId,
            previousStatus: addon.status,
            endDate: addon.endDate!,
            success: false,
            error: errorMessage,
          });

          errors.push({
            id: addon.id,
            type: "addon",
            error: errorMessage,
          });

          console.error(
            `[AddonExpiration] ❌ Failed to mark addon ${addon.id}:`,
            errorMessage
          );
        }
      }

      const executionTime = Date.now() - startTime;

      console.log(
        `[AddonExpiration] Marking completed: ${subscriptionResults.filter(r => r.success).length} subscriptions + ${addonResults.filter(r => r.success).length} addons marked as EXPIRED`
      );

      return {
        success: errors.length === 0,
        subscriptions: {
          totalMarked: subscriptionResults.filter(r => r.success).length,
          results: subscriptionResults,
        },
        addons: {
          totalMarked: addonResults.filter(r => r.success).length,
          results: addonResults,
        },
        errors,
        executionTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[AddonExpiration] Fatal error in markExpiredItems:", errorMessage);

      return {
        success: false,
        subscriptions: {
          totalMarked: 0,
          results: subscriptionResults,
        },
        addons: {
          totalMarked: 0,
          results: addonResults,
        },
        errors: [{ id: 0, type: "subscription", error: errorMessage }],
        executionTime: Date.now() - startTime,
      };
    }
  }
}
