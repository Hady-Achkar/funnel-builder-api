import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { configureWebhook } from "../service";
import { UnauthorizedError } from "../../../errors/http-errors";

export const configureWebhookController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const formId = parseInt(req.params.formId);

    if (!userId) {
      throw new UnauthorizedError("Please log in to configure webhooks");
    }

    if (!formId || isNaN(formId)) {
      throw new Error("Invalid form ID");
    }

    const result = await configureWebhook(userId, {
      ...req.body,
      formId,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

