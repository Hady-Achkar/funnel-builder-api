import { Request, Response } from "express";
import { PageService } from "../../services/page";
import { validateFunnelId, sendSuccessResponse, sendErrorResponse } from "./helper";

export const getPageByLinkingId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { linkingId } = req.params;
    const funnelId = validateFunnelId(req.params.funnelId);

    if (!funnelId) {
      res.status(400).json({
        success: false,
        error: "Please provide a valid funnel ID",
      });
      return;
    }

    if (!linkingId || typeof linkingId !== "string") {
      res.status(400).json({
        success: false,
        error: "Please provide a valid linking ID",
      });
      return;
    }

    const page = await PageService.getPageByLinkingId(funnelId, linkingId);

    if (!page) {
      res.status(404).json({
        success: false,
        error: "Page not found or not publicly accessible",
      });
      return;
    }

    sendSuccessResponse(res, page);
  } catch (error: any) {
    sendErrorResponse(res, error);
  }
};