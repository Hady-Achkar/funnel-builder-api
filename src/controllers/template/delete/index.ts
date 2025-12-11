import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../middleware/auth";
import { deleteTemplate } from "../../../services/template/delete";
import { deleteTemplateParams } from "../../../types/template/delete";
import { BadRequestError } from "../../../errors";

export const deleteTemplateController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { templateSlug } = deleteTemplateParams.parse(req.params);
    const isAdmin = req.isAdmin || false;

    const result = await deleteTemplate({
      templateSlug,
      isAdmin,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: { deletedTemplateSlug: result.deletedTemplateSlug },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid request data";
      return next(new BadRequestError(message));
    }
    next(error);
  }
};
