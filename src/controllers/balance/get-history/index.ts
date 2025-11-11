import { Request, Response, NextFunction } from "express";
import { getBalanceHistoryRequestSchema } from "../../../types/balance/get-history";
import { GetBalanceHistoryService } from "../../../services/balance/get-history";
import { ZodError } from "zod";

interface AuthRequest extends Request {
  userId?: number;
}

export class GetBalanceHistoryController {
  static async getHistory(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. Check authentication
      if (!req.userId) {
        res.status(401).json({
          error: "Please sign in to view your balance",
        });
        return;
      }

      // 2. Validate request query parameters
      const validatedRequest = getBalanceHistoryRequestSchema.parse(req.query);

      // 3. Call service
      const result = await GetBalanceHistoryService.getHistory(
        req.userId,
        validatedRequest
      );

      // 4. Send response
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Invalid request parameters",
          details: error.issues[0]?.message || "Please check your input",
        });
        return;
      }
      next(error);
    }
  }
}
