import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../../services/page";

export const updatePage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const pageId = parseInt(req.params.id);
    const { name, content, order, linkingId, seoTitle, seoDescription, seoKeywords } = req.body;

    if (!pageId || isNaN(pageId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid page ID"
      });
    }

    const result = await PageService.updatePage(pageId, userId, {
      name,
      content,
      order,
      linkingId,
      seoTitle,
      seoDescription,
      seoKeywords
    });

    res.json(result);
  } catch (e: any) {
    res.status(400).json({
      success: false,
      error: e.message || "Failed to update page"
    });
  }
};