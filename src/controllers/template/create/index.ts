import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { createTemplateFromFunnel } from "../../../services/template/create";
import { UnauthorizedError } from "../../../errors";

export const createTemplateFromFunnelController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const result = await createTemplateFromFunnel(userId, req.body, req.files);

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const createTemplateController = createTemplateFromFunnelController;