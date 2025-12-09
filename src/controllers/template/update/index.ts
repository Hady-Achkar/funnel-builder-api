import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../middleware/auth";
import { updateTemplate } from "../../../services/template/update";
import {
  updateTemplateBody,
  updateTemplateParams,
} from "../../../types/template/update";
import { BadRequestError } from "../../../errors";

export const updateTemplateController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { templateSlug } = updateTemplateParams.parse(req.params);
    const userId = req.userId;
    const isAdmin = req.isAdmin || false;

    if (!userId) {
      throw new BadRequestError("User ID is required");
    }

    const validatedBody = updateTemplateBody.parse(req.body);

    const result = await updateTemplate({
      templateSlug,
      userId,
      isAdmin,
      body: validatedBody,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid request data";
      return next(new BadRequestError(message));
    }
    next(error);
  }
};
