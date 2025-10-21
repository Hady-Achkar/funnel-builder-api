import { Request, Response, NextFunction } from "express";
import { CommissionReleaseService } from "../../services/cron/commission-release.service";

export class ReleaseCommissionsController {
  static async handleCronJob(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const startTime = Date.now();

    console.log("=====================================");
    console.log("[Cron] COMMISSION RELEASE JOB STARTED");
    console.log(`[Cron] Triggered at: ${new Date().toISOString()}`);
    console.log(`[Cron] Triggered by: ${req.ip}`);
    console.log("=====================================");

    try {
      // Run the commission release service
      const summary =
        await CommissionReleaseService.releaseEligibleCommissions();

      const executionTime = Date.now() - startTime;

      // Log summary
      console.log("=====================================");
      console.log("[Cron] COMMISSION RELEASE JOB COMPLETED");
      console.log(`[Cron] Total Eligible: ${summary.totalEligible}`);
      console.log(`[Cron] Total Released: ${summary.totalReleased}`);
      console.log(`[Cron] Total Failed: ${summary.totalFailed}`);
      console.log(`[Cron] Total Amount: $${summary.totalAmount.toFixed(2)}`);
      console.log(`[Cron] Execution Time: ${executionTime}ms`);
      console.log("=====================================");

      // Return success response
      res.status(200).json({
        success: true,
        message: "Commission release job completed successfully",
        summary: {
          totalEligible: summary.totalEligible,
          totalReleased: summary.totalReleased,
          totalFailed: summary.totalFailed,
          totalAmount: summary.totalAmount,
          executionTime,
        },
        details: {
          releasedPayments: summary.releasedPayments.map((p) => ({
            paymentId: p.paymentId,
            transactionId: p.transactionId,
            affiliateOwnerId: p.affiliateOwnerId,
            amount: p.commissionAmount,
          })),
          failedPayments: summary.failedPayments.map((p) => ({
            paymentId: p.paymentId,
            transactionId: p.transactionId,
            error: p.error,
          })),
        },
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.error("=====================================");
      console.error("[Cron] COMMISSION RELEASE JOB FAILED");
      console.error(`[Cron] Execution Time: ${executionTime}ms`);
      console.error(`[Cron] Error:`, error);
      console.error("=====================================");

      // Pass error to error handler middleware
      next(error);
    }
  }
}
