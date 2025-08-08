import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { FunnelService } from "../../services/funnel";

export const deleteFunnel = async (req: AuthRequest, res: Response) => {
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

    const result = await FunnelService.deleteFunnel(funnelId, userId);

    res.json({
      success: true,
      id: result.id,
      name: result.name,
      message: result.message
    });
  } catch (e: any) {
    res.status(400).json({
      success: false,
      error: e.message || "Failed to delete funnel"
    });
  }
};