import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { getAllWorkspaces } from "../../../services/workspace/get-all";
import { UnauthorizedError } from "../../../errors/http-errors";

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

    const result = await getAllWorkspaces(userId);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};