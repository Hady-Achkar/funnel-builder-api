import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { getSessionHistory } from "../../../services/session/get-history";
import { getSessionHistoryParams } from "../../../types/session/get-history";

export const getSessionHistoryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized: User ID is required",
      });
    }

    const { workspaceSlug, funnelSlug } = req.params;
    if (!workspaceSlug || !funnelSlug) {
      return res.status(400).json({
        message: "Workspace slug and funnel slug are required",
      });
    }

    // Validate and parse query parameters
    const validatedParams = getSessionHistoryParams.parse({
      workspaceSlug,
      funnelSlug,
      search: req.query.search,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      page: req.query.page,
      limit: req.query.limit,
    });

    const result = await getSessionHistory(validatedParams, userId);
    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("permission")) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message.includes("Invalid")) {
        return res.status(400).json({ message: error.message });
      }
    }
    next(error);
  }
};
