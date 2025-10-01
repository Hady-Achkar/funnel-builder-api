import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { getAllWorkspaces } from "../../../services/workspace/get-all";
import { UnauthorizedError } from "../../../errors/http-errors";
import { getAllWorkspacesRequest } from "../../../types/workspace/get-all";

export const getAllWorkspacesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Please log in to view workspaces");
    }

    const { page, limit, sortBy, sortOrder, role, search } = req.query;

    const validatedQuery = getAllWorkspacesRequest.parse({
      page,
      limit,
      sortBy,
      sortOrder,
      role,
      search,
    });

    const result = await getAllWorkspaces(userId, validatedQuery);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};
