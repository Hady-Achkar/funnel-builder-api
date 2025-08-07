import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../../services/page";
import { validateFunnelId, sendErrorResponse } from "./helper";

export const getFunnelPageVisits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const userId = req.userId;
    const funnelId = validateFunnelId(req.params.funnelId);

    if (!funnelId) {
      res.status(400).json({
        success: false,
        error: "Please provide a valid funnel ID",
      });
      return;
    }

    const result = await PageService.getFunnelPageVisits(funnelId, userId);
    
    res.status(200).json({
      success: result.success,
      data: result.data,
      message: result.message,
    });
  } catch (error: any) {
    sendErrorResponse(res, error);
  }
};