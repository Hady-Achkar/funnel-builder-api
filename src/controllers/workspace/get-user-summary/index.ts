import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetUserWorkspacesSummaryService } from "../../../services/workspace/get-user-summary";
import { getUserWorkspacesSummaryRequestSchema } from "../../../types/workspace/get-user-summary/get-user-summary.types";
import { UnauthorizedError } from "../../../errors/http-errors";
import { ZodError } from "zod";

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

      // Validate request query parameters
      const validatedRequest = getUserWorkspacesSummaryRequestSchema.parse(req.query);

      const result = await GetUserWorkspacesSummaryService.getUserWorkspacesSummary(
        userId,
        validatedRequest
      );

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