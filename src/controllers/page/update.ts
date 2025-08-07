import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../../services/page";
import { validatePageId, sendErrorResponse } from "./helper";

export const updatePage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const pageId = validatePageId(req.params.id);
    const {
      name,
      content,
      order,
      linkingId,
      seoTitle,
      seoDescription,
      seoKeywords,
    } = req.body;

    if (!pageId) {
      res.status(400).json({
        success: false,
        error: "Please provide a valid page ID",
      });
      return;
    }

    const result = await PageService.updatePage(pageId, userId, {
      name,
      content,
      order,
      linkingId,
      seoTitle,
      seoDescription,
      seoKeywords,
    });

    res.status(200).json(result);
  } catch (error: any) {
    sendErrorResponse(res, error);
  }
};