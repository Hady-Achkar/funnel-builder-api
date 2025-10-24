import { Request, Response } from "express";
import { AddonExpirationService } from "../../services/cron/addon-expiration";

/**
 * Addon Expiration Controller
 *
 * Entry point for addon expiration cron job
 * Should be called by Azure Functions timer trigger or manual endpoint
 *
 * Performs three operations:
 * 1. Mark all expired subscriptions and addons as EXPIRED
 * 2. Send warning emails (7, 3, 1 day before expiration)
 * 3. Process expired addons (disable resources)
 */
export class AddonExpirationController {
  /**
   * Main endpoint for running addon expiration job
   */
  static async run(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    console.log("\n========================================");
    console.log("🔄 ADDON EXPIRATION CRON JOB STARTED");
    console.log(`⏰ ${new Date().toISOString()}`);
    console.log("========================================\n");

    try {
      // Step 1: Mark expired subscriptions and addons
      console.log("🏷️  Step 1: Marking expired subscriptions and addons...");
      const markingResult = await AddonExpirationService.markExpiredItems();

      console.log("\n✅ Expiration marking completed:");
      console.log(`   - Subscriptions marked: ${markingResult.subscriptions.totalMarked}`);
      console.log(`   - Addons marked: ${markingResult.addons.totalMarked}`);
      console.log(`   - Errors: ${markingResult.errors.length}`);
      console.log(`   - Execution time: ${markingResult.executionTime}ms\n`);

      // Step 2: Send warning emails
      console.log("📧 Step 2: Sending warning emails...");
      const emailResult = await AddonExpirationService.sendWarningEmails();

      console.log("\n✅ Warning emails completed:");
      console.log(`   - 7-day warnings: ${emailResult.day7Sent}`);
      console.log(`   - 3-day warnings: ${emailResult.day3Sent}`);
      console.log(`   - 1-day warnings: ${emailResult.day1Sent}`);
      console.log(`   - Failed: ${emailResult.totalFailed}`);
      console.log(`   - Execution time: ${emailResult.executionTime}ms\n`);

      // Step 3: Process expired addons
      console.log("⚙️  Step 3: Processing expired addons...");
      const expirationResult =
        await AddonExpirationService.processExpiredAddons();

      console.log("\n✅ Addon expiration completed:");
      console.log(`   - Total expired: ${expirationResult.totalExpired}`);
      console.log(`   - Successfully processed: ${expirationResult.totalProcessed}`);
      console.log(`   - Failed: ${expirationResult.totalFailed}`);
      console.log(`   - Execution time: ${expirationResult.executionTime}ms\n`);

      // Calculate total execution time
      const totalTime = Date.now() - startTime;

      console.log("========================================");
      console.log("✅ ADDON EXPIRATION CRON JOB COMPLETED");
      console.log(`⏱️  Total execution time: ${totalTime}ms`);
      console.log("========================================\n");

      // Return summary
      res.status(200).json({
        success: markingResult.success && emailResult.success && expirationResult.success,
        marking: {
          subscriptionsMarked: markingResult.subscriptions.totalMarked,
          addonsMarked: markingResult.addons.totalMarked,
          subscriptionDetails: markingResult.subscriptions.results,
          addonDetails: markingResult.addons.results,
          errors: markingResult.errors,
          executionTime: markingResult.executionTime,
        },
        warnings: {
          eligible: emailResult.totalEligible,
          day7Sent: emailResult.day7Sent,
          day3Sent: emailResult.day3Sent,
          day1Sent: emailResult.day1Sent,
          failed: emailResult.totalFailed,
          executionTime: emailResult.executionTime,
        },
        expirations: {
          totalExpired: expirationResult.totalExpired,
          processed: expirationResult.totalProcessed,
          failed: expirationResult.totalFailed,
          executionTime: expirationResult.executionTime,
        },
        totalExecutionTime: totalTime,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error("\n❌ ADDON EXPIRATION CRON JOB FAILED");
      console.error(`Error: ${errorMessage}`);
      if (errorStack) {
        console.error(`Stack: ${errorStack}`);
      }
      console.error("========================================\n");

      res.status(500).json({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
