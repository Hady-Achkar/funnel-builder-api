import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../../services/page";
import { validatePageId, validateFunnelId, sendCreatedResponse, sendErrorResponse } from "./helper";

export const duplicatePage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const pageId = validatePageId(req.params.pageId);
    const { targetFunnelId, newName, newLinkingId } = req.body;

    if (!pageId) {
      res.status(400).json({ 
        success: false,
        error: "Invalid page ID" 
      });
      return;
    }

    let parsedTargetFunnelId: number | undefined;
    if (targetFunnelId !== undefined) {
      const validatedId = validateFunnelId(targetFunnelId);
      if (!validatedId && targetFunnelId !== null) {
        res.status(400).json({ 
          success: false,
          error: "Invalid target funnel ID" 
        });
        return;
      }
      parsedTargetFunnelId = validatedId || undefined;
    }

    const duplicatedPage = await PageService.duplicatePage(pageId, userId, {
      targetFunnelId: parsedTargetFunnelId,
      newName,
      newLinkingId,
    });

    sendCreatedResponse(
      res,
      {
        id: duplicatedPage.id,
        name: duplicatedPage.name,
        linkingId: duplicatedPage.linkingId,
        order: duplicatedPage.order,
        funnelId: duplicatedPage.funnelId,
      },
      duplicatedPage.message
    );
  } catch (error: any) {
    sendErrorResponse(res, error);
  }
};