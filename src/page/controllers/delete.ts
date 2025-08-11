import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../services";

export const deletePage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const pageId = parseInt(req.params.id);

    if (!pageId || isNaN(pageId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid page ID"
      });
    }

    const result = await PageService.deletePage(pageId, userId);
    
    res.json(result);
  } catch (e: any) {
    res.status(400).json({
      success: false,
      error: e.message || "Failed to delete page"
    });
  }
};