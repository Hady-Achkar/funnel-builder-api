import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetWorkspaceFunnelsSummaryService } from "../../../services/funnel/get-workspace-summary";

export class GetWorkspaceFunnelsSummaryController {
  static async getWorkspaceFunnelsSummary(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { workspaceSlug } = req.params;
      const userId = req.userId!;

      const result = await GetWorkspaceFunnelsSummaryService.getWorkspaceFunnelsSummary(
        userId,
        { workspaceSlug }
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}