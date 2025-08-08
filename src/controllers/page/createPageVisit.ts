import { Request, Response } from "express";
import { PageService } from "../../services/page";

export const createPageVisit = async (req: Request, res: Response) => {
  try {
    const pageId = parseInt(req.params.pageId);
    const { sessionId } = req.body;

    if (!pageId || isNaN(pageId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid page ID"
      });
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Session ID is required"
      });
    }

    const result = await PageService.createPageVisit(pageId, sessionId);
    
    res.json(result);
  } catch (e: any) {
    res.status(400).json({
      success: false,
      error: e.message || "Failed to record visit"
    });
  }
};