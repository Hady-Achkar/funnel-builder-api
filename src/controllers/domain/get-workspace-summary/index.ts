import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetWorkspaceDomainsSummaryService } from "../../../services/domain/get-workspace-summary";

export class GetWorkspaceDomainsSummaryController {
  static async getWorkspaceDomainsSummary(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { workspaceSlug } = req.params;
      const userId = req.userId!;

      const result =
        await GetWorkspaceDomainsSummaryService.getWorkspaceDomainsSummary(
          userId,
          { workspaceSlug }
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
