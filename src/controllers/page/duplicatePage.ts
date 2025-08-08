import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../../services/page";

export const duplicatePage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const pageId = parseInt(req.params.pageId);
    const { targetFunnelId, newName, newLinkingId } = req.body;

    if (!pageId || isNaN(pageId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid page ID" 
      });
    }

    let parsedTargetFunnelId: number | undefined;
    if (targetFunnelId !== undefined) {
      parsedTargetFunnelId = parseInt(targetFunnelId);
      if (isNaN(parsedTargetFunnelId)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid target funnel ID" 
        });
      }
    }

    const duplicatedPage = await PageService.duplicatePage(pageId, userId, {
      targetFunnelId: parsedTargetFunnelId,
      newName,
      newLinkingId
    });

    res.status(201).json({
      success: true,
      id: duplicatedPage.id,
      name: duplicatedPage.name,
      linkingId: duplicatedPage.linkingId,
      order: duplicatedPage.order,
      funnelId: duplicatedPage.funnelId,
      message: duplicatedPage.message
    });
  } catch (e: any) {
    res.status(400).json({
      success: false,
      error: e.message || "Failed to duplicate page"
    });
  }
};