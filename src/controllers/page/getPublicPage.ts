import { Request, Response } from "express";
import { PageService } from "../../services/page";

export const getPublicPage = async (req: Request, res: Response) => {
  try {
    const funnelId = parseInt(req.params.funnelId);
    const { linkingId } = req.params;

    if (!funnelId || isNaN(funnelId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid funnel ID"
      });
    }

    if (!linkingId) {
      return res.status(400).json({
        success: false,
        error: "Linking ID is required"
      });
    }

    const page = await PageService.getPublicPage(funnelId, linkingId);

    res.json({
      success: true,
      data: page
    });
  } catch (e: any) {
    const status = e.message?.includes("not found") ? 404 : 400;
    res.status(status).json({
      success: false,
      error: e.message || "Failed to get page"
    });
  }
};