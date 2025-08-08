import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { FunnelService } from "../../services/funnel";

export const getFunnelById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }
    const funnelId = parseInt(req.params.id);

    if (!funnelId || isNaN(funnelId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid funnel ID"
      });
    }

    const funnel = await FunnelService.getFunnelById(funnelId, userId);

    if (!funnel) {
      return res.status(404).json({
        success: false,
        error: "Funnel not found"
      });
    }

    res.json({
      success: true,
      data: funnel
    });
  } catch (e: any) {
    if (e.message && e.message.includes("access")) {
      return res.status(403).json({
        success: false,
        error: e.message
      });
    }
    
    res.status(400).json({
      success: false,
      error: e.message || "Failed to get funnel"
    });
  }
};