import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../../services/page";
import { validatePageId, sendSuccessResponse, sendErrorResponse } from "./helper";

export const getPageById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const pageId = validatePageId(req.params.id);

    if (!pageId) {
      res.status(400).json({
        success: false,
        error: "Please provide a valid page ID",
      });
      return;
    }

    const page = await PageService.getPageById(pageId, userId);

    if (!page) {
      res.status(404).json({
        success: false,
        error: "The specified page could not be found or you don't have access to it",
      });
      return;
    }

    sendSuccessResponse(res, page, `Retrieved page "${page.name}" successfully`);
  } catch (error: any) {
    sendErrorResponse(res, error);
  }
};