import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { FunnelService } from "../../services/funnel";
import { validateFunnelId, sendErrorResponse } from "./helper";

export const deleteFunnel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const funnelId = validateFunnelId(req.params.id);

    if (!funnelId) {
      res.status(400).json({
        success: false,
        error: "Invalid funnel ID",
      });
      return;
    }

    const result = await FunnelService.deleteFunnel(funnelId, userId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    sendErrorResponse(res, error);
  }
};