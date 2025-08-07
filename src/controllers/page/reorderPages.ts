import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../../services/page";
import { validateFunnelId, sendErrorResponse } from "./helper";

export const reorderPages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const funnelId = validateFunnelId(req.params.funnelId);
    const { pageOrders } = req.body;

    if (!funnelId) {
      res.status(400).json({ 
        success: false,
        error: "Invalid funnel ID" 
      });
      return;
    }

    if (!Array.isArray(pageOrders)) {
      res.status(400).json({ 
        success: false,
        error: "Page orders must be an array" 
      });
      return;
    }

    await PageService.reorderPages(funnelId, userId, pageOrders);
    
    res.json({ 
      success: true,
      message: "Pages reordered successfully" 
    });
  } catch (error: any) {
    sendErrorResponse(res, error);
  }
};