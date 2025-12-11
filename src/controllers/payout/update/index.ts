import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  updatePayoutRequest,
  UpdatePayoutRequest,
} from "../../../types/payout/update";
import { UpdatePayoutService } from "../../../services/payout/update";
import { getPrisma } from "../../../lib/prisma";
import { checkUserPermissions } from "./utils/check-user-permissions";
import { hasSufficientBalance } from "./utils/validate-balance";
import { isTransactionIdUnique } from "./utils/check-transaction-id-uniqueness";
import { AuthRequest } from "../../../middleware/auth";

export class UpdatePayoutController {
  static async update(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const prisma = getPrisma();

      // 1. Check authentication
      if (!req.userId) {
        res.status(401).json({
          error: "Please sign in to update payout",
        });
        return;
      }

      // 2. Validate payout ID
      const payoutId = parseInt(req.params.id);
      if (isNaN(payoutId)) {
        res.status(400).json({
          error: "Invalid payout ID",
        });
        return;
      }

      // 3. Validate request body with Zod
      let validatedData: UpdatePayoutRequest;
      try {
        validatedData = updatePayoutRequest.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          // Check if the error is related to status field
          const statusError = error.issues.find(
            (issue) => issue.path[0] === "status"
          );
          if (statusError) {
            res.status(400).json({
              error: "Invalid status value",
            });
            return;
          }

          // Check if the error is related to adminCode field
          const adminCodeError = error.issues.find(
            (issue) => issue.path[0] === "adminCode"
          );
          if (adminCodeError) {
            res.status(400).json({
              error: "Invalid admin code",
            });
            return;
          }

          res.status(400).json({
            error: error.issues[0].message,
          });
          return;
        }
        throw error;
      }

      // 4. Get payout from database
      const payout = await prisma.payout.findUnique({
        where: { id: payoutId },
      });

      if (!payout) {
        res.status(404).json({
          error: "Payout not found",
        });
        return;
      }

      // 5. Special check: If payout is CANCELLED and user is trying to update it (before permission check)
      if (validatedData.status && payout.status === "CANCELLED") {
        res.status(400).json({
          error: "Cannot modify a cancelled payout",
        });
        return;
      }

      // 6. Check user permissions
      const permissionCheck = checkUserPermissions(
        req.userId,
        req.isAdmin || false,
        payout.userId,
        payout.status,
        validatedData
      );

      if (!permissionCheck.allowed) {
        res.status(403).json({
          error: permissionCheck.error,
        });
        return;
      }

      // 8. If user is admin, admin code is REQUIRED
      const isAdmin = req.isAdmin || false;
      if (isAdmin && !validatedData.adminCode) {
        res.status(400).json({
          error: "Admin code is required for admin updates",
        });
        return;
      }

      // 9. If admin code is provided, it must be valid (already validated by Zod)
      if (validatedData.adminCode) {
        // Validation is already done by Zod schema
        // If we reach here, the admin code is valid
      }

      // 10. Check if trying to modify COMPLETED or FAILED state (after permission check for admins)
      // Admins pass permission check, but still can't modify these final states
      if (validatedData.status && validatedData.status !== payout.status) {
        if (payout.status === "COMPLETED" || payout.status === "FAILED") {
          const errorMessage =
            payout.status === "COMPLETED"
              ? "Cannot modify a completed payout"
              : "Cannot modify a failed payout";

          res.status(400).json({
            error: errorMessage,
          });
          return;
        }
      }

      // 11. Check transaction ID uniqueness if being updated
      if (
        validatedData.transactionId &&
        validatedData.transactionId.trim() !== ""
      ) {
        const existingPayouts = await prisma.payout.findMany({
          where: {
            transactionId: validatedData.transactionId.trim(),
          },
        });

        if (
          !isTransactionIdUnique(
            validatedData.transactionId.trim(),
            payoutId,
            existingPayouts
          )
        ) {
          res.status(400).json({
            error: "Transaction ID already exists",
          });
          return;
        }
      }

      // 12. If completing payout, check user balance
      if (validatedData.status === "COMPLETED") {
        const user = await prisma.user.findUnique({
          where: { id: payout.userId },
          select: { balance: true },
        });

        if (!user) {
          res.status(404).json({
            error: "User not found",
          });
          return;
        }

        if (!hasSufficientBalance(user.balance, payout.amount)) {
          res.status(400).json({
            error: "User has insufficient balance to complete this payout",
          });
          return;
        }
      }

      // 13. Call service to update payout
      try {
        const result = await UpdatePayoutService.update(
          payoutId,
          validatedData,
          permissionCheck.isUserSelfCancellation || false,
          validatedData.adminCode
        );

        // 14. Send response
        res.status(200).json(result);
      } catch (serviceError: any) {
        // Handle specific service errors
        if (serviceError.message === "No fields to update") {
          res.status(400).json({
            error: "At least one field must be provided to update",
          });
          return;
        }
        throw serviceError;
      }
    } catch (error) {
      next(error);
    }
  }
}
