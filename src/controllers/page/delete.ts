import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../../services/page";
import { validatePageId, sendErrorResponse } from "./helper";

export const deletePage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const pageId = validatePageId(req.params.id);

    if (!pageId) {
      res.status(400).json({
        success: false,
        error: "Invalid page ID",
      });
      return;
    }

    await PageService.deletePage(pageId, userId);
    
    res.json({
      success: true,
      message: "Page deleted successfully",
    });
  } catch (error: any) {
    sendErrorResponse(res, error);
  }
};