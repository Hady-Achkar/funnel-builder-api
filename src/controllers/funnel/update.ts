import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { FunnelService } from "../../services/funnel";
import { validateFunnelId, validateDomainId, sendErrorResponse } from "./helper";

export const updateFunnel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const funnelId = validateFunnelId(req.params.id);
    const { name, status, domainId } = req.body;

    if (!funnelId) {
      res.status(400).json({
        success: false,
        error: "Invalid funnel ID",
      });
      return;
    }

    const parsedDomainId = validateDomainId(domainId);
    if (domainId !== undefined && parsedDomainId === null && domainId !== null) {
      res.status(400).json({
        success: false,
        error: "Invalid domain ID",
      });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (domainId !== undefined) updateData.domainId = parsedDomainId;

    const funnel = await FunnelService.updateFunnel(funnelId, userId, updateData);

    res.json({
      success: true,
      ...funnel,
      message: "Funnel updated successfully",
    });
  } catch (error: any) {
    sendErrorResponse(res, error);
  }
};