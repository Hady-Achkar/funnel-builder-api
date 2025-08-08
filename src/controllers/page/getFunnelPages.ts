import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../../services/page";

export const getFunnelPages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const funnelId = parseInt(req.params.funnelId);

    if (!funnelId || isNaN(funnelId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid funnel ID"
      });
    }

    const pages = await PageService.getFunnelPages(funnelId, userId);
    
    res.json({
      success: true,
      data: pages
    });
  } catch (e: any) {
    res.status(400).json({
      success: false,
      error: e.message || "Failed to get pages"
    });
  }
};