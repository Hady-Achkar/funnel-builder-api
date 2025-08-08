import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { FunnelService } from "../../services/funnel";

export const updateFunnel = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }
    const funnelId = parseInt(req.params.id);
    const { name, status, domainId } = req.body;

    if (!funnelId || isNaN(funnelId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid funnel ID"
      });
    }

    const funnel = await FunnelService.updateFunnel(funnelId, userId, {
      name,
      status,
      domainId
    });

    res.json({
      success: true,
      funnel,
      message: "Funnel updated successfully"
    });
  } catch (e: any) {
    res.status(400).json({
      success: false,
      error: e.message || "Failed to update funnel"
    });
  }
};