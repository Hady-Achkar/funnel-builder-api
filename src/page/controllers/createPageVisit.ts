import { Request, Response } from "express";
import { PageService } from "../services";

export const createPageVisit = async (req: Request, res: Response) => {
  try {
    const pageId = Number(req.params.pageId);
    const result = await PageService.createPageVisit({ pageId }, req.body);

    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    if (error.message.includes("Invalid input")) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (error.message.includes("not found")) {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred",
    });
  }
};
