import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../services";

export const duplicatePage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, error: "Authentication required" });
    }

    const result = await PageService.duplicatePage(
      { pageId: Number(req.params.pageId) },
      req.userId,
      req.body
    );

    return res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred",
    });
  }
};
