import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../services";

export const getPageById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const pageId = parseInt(req.params.id);

    if (!pageId || isNaN(pageId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid page ID"
      });
    }

    const page = await PageService.getPageById(pageId, userId);

    if (!page) {
      return res.status(404).json({
        success: false,
        error: "Page not found or you don't have access"
      });
    }

    res.json({
      success: true,
      data: page
    });
  } catch (e: any) {
    res.status(400).json({
      success: false,
      error: e.message || "Failed to get page"
    });
  }
};