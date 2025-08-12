import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../services";

export const getPageById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, error: "Authentication required" });
    }

    const pageId = parseInt(req.params.id);
    if (isNaN(pageId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid page ID",
      });
    }

    const result = await PageService.getPageById({ pageId }, req.userId);

    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred",
    });
  }
};
