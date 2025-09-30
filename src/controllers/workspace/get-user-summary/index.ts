import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetUserWorkspacesSummaryService } from "../../../services/workspace/get-user-summary";
import { UnauthorizedError } from "../../../errors/http-errors";

export class GetUserWorkspacesSummaryController {
  static async getUserWorkspacesSummary(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new UnauthorizedError("Please log in to view workspaces");
      }

      const result = await GetUserWorkspacesSummaryService.getUserWorkspacesSummary(userId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}