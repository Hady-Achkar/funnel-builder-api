import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../services";

export const reorderPages = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, error: "Authentication required" });
    }

    const result = await PageService.reorderPages(
      { funnelId: Number(req.params.funnelId) },
      req.userId,
      req.body
    );

    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    if (error?.message?.includes?.("Invalid input")) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (
      error?.message?.includes?.("not found") ||
      error?.message?.includes?.("access")
    ) {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({
      success: false,
      error: error?.message || "An unexpected error occurred",
    });
  }
};
