import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { requestPayoutRequest } from "../../../types/payout/request";
import { RequestPayoutService } from "../../../services/payout/request";
import { validateBalance } from "./utils/validate-balance";
import {
  calculatePendingAmount,
  calculateAvailableBalance,
} from "./utils/check-pending-payouts";
import { checkDuplicateSubmission } from "./utils/check-duplicate-submission";
import { getPrisma } from "../../../lib/prisma";
import { BadRequestError, UnauthorizedError } from "../../../errors";

export class RequestPayoutController {
  static async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. Check authentication
      const userId = (req as any).userId;
      if (!userId) {
        res.status(401).json({
          error: "Please sign in to request a withdrawal",
        });
        return;
      }

      // 2. Validate request with Zod
      let validatedData;
      try {
        validatedData = requestPayoutRequest.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          // Return the first validation error with user-friendly message
          const firstError = error.issues[0];
          res.status(400).json({
            error: firstError.message,
          });
          return;
        }
        throw error;
      }

      const prisma = getPrisma();

      // 3. Get user's current balance and pending payouts
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      });

      if (!user) {
        return next(new UnauthorizedError("User not found"));
      }

      // 4. Get all user's payouts to check for pending amounts and duplicates
      const userPayouts = await prisma.payout.findMany({
        where: { userId },
        select: {
          id: true,
          amount: true,
          status: true,
          method: true,
          createdAt: true,
        },
      });

      // 5. Calculate pending amount and available balance FIRST
      const pendingAmount = calculatePendingAmount(userPayouts);
      const availableBalance = calculateAvailableBalance(
        user.balance,
        pendingAmount
      );

      // 6. Validate balance
      const balanceValidation = validateBalance(
        user.balance,
        validatedData.amount,
        availableBalance
      );

      if (!balanceValidation.isValid) {
        res.status(400).json({
          error: balanceValidation.error,
        });
        return;
      }

      // 7. Check for duplicate submission within 5 seconds (only if balance is valid)
      const isDuplicate = checkDuplicateSubmission(
        userPayouts,
        validatedData.amount,
        validatedData.method
      );

      if (isDuplicate) {
        res.status(400).json({
          error: "Please wait before submitting another withdrawal request",
        });
        return;
      }

      // 8. Create payout request through service
      const result = await RequestPayoutService.create(userId, validatedData);

      // 9. Send success response
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
