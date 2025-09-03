import { Request, Response, NextFunction } from "express";
import { getPublicPage } from "../../../services/page/getPublicPage";

export const getPublicPageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const funnelSlug = req.params.funnelSlug;
    const linkingId = req.params.linkingId;

    if (!funnelSlug || !linkingId) {
      return res.status(400).json({ error: "Funnel slug and linking ID are required" });
    }

    const requestBody = { funnelSlug, linkingId };

    const result = await getPublicPage(requestBody);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};