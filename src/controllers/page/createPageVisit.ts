import { Request, Response } from "express";
import { PageService } from "../../services/page";
import { validatePageId, sendErrorResponse } from "./helper";

export const createPageVisit = async (req: Request, res: Response): Promise<void> => {
  try {
    const pageId = validatePageId(req.params.pageId);
    const { sessionId } = req.body;

    if (!pageId) {
      res.status(400).json({
        success: false,
        error: "Please provide a valid page ID",
      });
      return;
    }

    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: "Please provide a valid session ID",
      });
      return;
    }

    const result = await PageService.createPageVisit(pageId, sessionId.trim());
    
    res.status(200).json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    sendErrorResponse(res, error);
  }
};