import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { createForm } from "../service";
import { UnauthorizedError } from "../../../errors";

export const createFormController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const result = await createForm(userId, req.body);

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};