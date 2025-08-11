import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { PageService } from "../services";

export const createPage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    const result = await PageService.createPage(
      { funnelId: req.params.funnelId },
      req.userId,
      req.body
    );

    return res.status(201).json({ success: true, ...result });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Invalid input"))
        return res.status(400).json({ success: false, error: error.message });
      if (error.message.includes("not found") || error.message.includes("access"))
        return res.status(404).json({ success: false, error: "Funnel not found" });
      if (error.message.includes("Page creation failed"))
        return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Unable to create page" });
  }
};