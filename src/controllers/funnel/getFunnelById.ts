import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { FunnelService } from "../../services/funnel";
import { validateFunnelId, sendErrorResponse } from "./helper";

export const getFunnelById = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const funnel = await FunnelService.getFunnelById(funnelId, userId);

    if (!funnel) {
      res.status(404).json({
        success: false,
        error: "Funnel not found",
      });
      return;
    }

    res.json({
      success: true,
      ...funnel,
    });
  } catch (error: any) {
    if (error.message === "Access denied") {
      res.status(403).json({
        success: false,
        error: "Access denied",
      });
      return;
    }
    sendErrorResponse(res, error);
  }
};