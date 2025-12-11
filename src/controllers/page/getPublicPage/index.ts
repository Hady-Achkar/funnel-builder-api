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
    const hostname = req.query.hostname as string;

    if (!funnelSlug || !linkingId || !hostname) {
      return res.status(400).json({
        error: "Funnel slug, linking ID, and hostname are required"
      });
    }

    const requestBody = { funnelSlug, linkingId, hostname };

    const result = await getPublicPage(requestBody);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};