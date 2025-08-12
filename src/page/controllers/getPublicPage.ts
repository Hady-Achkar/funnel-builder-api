import { Request, Response } from "express";
import { PageService } from "../services";

export const getPublicPage = async (req: Request, res: Response) => {
  try {
    const { linkingId, funnelId } = req.params as {
      linkingId: string;
      funnelId: string;
    };
    const result = await PageService.getPublicPage({
      linkingId,
      funnelId: Number(funnelId),
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    if (error?.message?.includes?.("not found")) {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error?.message?.includes?.("not publicly accessible")) {
      return res.status(403).json({ success: false, error: error.message });
    }
    return res.status(500).json({
      success: false,
      error: error?.message || "An unexpected error occurred",
    });
  }
};
