import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../services";

export const reorderPages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const funnelId = parseInt(req.params.funnelId);
    const { pageOrders } = req.body;

    if (!funnelId || isNaN(funnelId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid funnel ID"
      });
    }

    if (!Array.isArray(pageOrders) || pageOrders.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Page orders array is required"
      });
    }

    const result = await PageService.reorderPages(funnelId, userId, pageOrders);
    
    res.json(result);
  } catch (e: any) {
    res.status(400).json({
      success: false,
      error: e.message || "Failed to reorder pages"
    });
  }
};