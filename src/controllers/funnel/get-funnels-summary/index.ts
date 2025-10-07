import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetFunnelsSummaryService } from "../../../services/funnel/get-funnels-summary";

export class GetFunnelsSummaryController {
  static async getFunnelsSummary(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { workspaceSlug } = req.params;
      const { search } = req.query;
      const userId = req.userId!;

      const result = await GetFunnelsSummaryService.getFunnelsSummary(
        userId,
        {
          workspaceSlug,
          search: search as string,
        }
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}