import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { FunnelService } from "../../services/funnel";
import { parseListQuery, validateQueryParams } from "./helper";

export const getUserFunnels = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const query = parseListQuery(req.query);
    
    const validationErrors = validateQueryParams(req.query);
    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        error: validationErrors[0],
      });
      return;
    }

    const result = await FunnelService.getUserFunnels(userId, query);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Get funnels error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch funnels. Please try again later.",
    });
  }
};