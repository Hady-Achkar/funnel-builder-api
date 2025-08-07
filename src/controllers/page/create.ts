import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../../services/page";
import { validateFunnelId, sendCreatedResponse, sendErrorResponse } from "./helper";

export const createPage = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const page = await PageService.createPage(funnelId, userId);
    
    sendCreatedResponse(
      res,
      {
        id: page.id,
        name: page.name,
        linkingId: page.linkingId,
        order: page.order,
      },
      page.message
    );
  } catch (error: any) {
    sendErrorResponse(res, error);
  }
};