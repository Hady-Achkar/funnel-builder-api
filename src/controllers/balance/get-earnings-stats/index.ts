import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetEarningsStatsService } from "../../../services/balance/get-earnings-stats";
import { UnauthorizedError } from "../../../errors/http-errors";

export class GetEarningsStatsController {
  static async getEarningsStats(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new UnauthorizedError("Please log in to view earnings stats");
      }

      const result = await GetEarningsStatsService.getEarningsStats(userId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
