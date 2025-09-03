import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { createFromTemplate } from "../../../services/funnel/createFromTemplate";
import { UnauthorizedError } from "../../../errors/http-errors";

export const createFromTemplateController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Please log in to create a funnel from template");
    }

    const templateId = parseInt(req.params.templateId);
    const data = req.body;

    const result = await createFromTemplate(templateId, userId, data);

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};