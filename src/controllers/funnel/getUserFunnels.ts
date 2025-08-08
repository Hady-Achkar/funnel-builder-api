import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { FunnelService } from "../../services/funnel";

export const getUserFunnels = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }
    
    // Parse query params with defaults
    const query = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      status: req.query.status as string,
      sortBy: req.query.sortBy as any || "createdAt",
      sortOrder: req.query.sortOrder as any || "desc"
    };

    const result = await FunnelService.getUserFunnels(userId, query);

    res.json({
      success: true,
      data: result.funnels,
      pagination: result.pagination
    });
  } catch (e: any) {
    res.status(400).json({
      success: false,
      error: e.message || "Failed to fetch funnels"
    });
  }
};