import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../../services/page";
import { validateFunnelId, sendSuccessResponse, sendErrorResponse } from "./helper";

export const getFunnelPages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const funnelId = validateFunnelId(req.params.funnelId);

    if (!funnelId) {
      res.status(400).json({
        success: false,
        error: "Please provide a valid funnel ID",
      });
      return;
    }

    const pages = await PageService.getFunnelPages(funnelId, userId);

    sendSuccessResponse(
      res,
      pages,
      `Retrieved ${pages.length} page${pages.length === 1 ? "" : "s"} from funnel`
    );
  } catch (error: any) {
    sendErrorResponse(res, error);
  }
};