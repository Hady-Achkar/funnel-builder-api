import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../../services/page";

export const createPage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const funnelId = parseInt(req.params.funnelId);
    const { name, content, linkingId } = req.body;

    if (!funnelId || isNaN(funnelId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid funnel ID"
      });
    }

    const page = await PageService.createPage(funnelId, userId, {
      name,
      content,
      linkingId
    });
    
    res.status(201).json({
      success: true,
      id: page.id,
      name: page.name,
      linkingId: page.linkingId,
      order: page.order,
      message: page.message
    });
  } catch (e: any) {
    res.status(400).json({
      success: false,
      error: e.message || "Failed to create page"
    });
  }
};