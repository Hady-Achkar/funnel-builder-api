import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { getTemplatePage } from "../../../services/template/get-page";
import { getTemplatePageParams } from "../../../types/template/get-page";
import { BadRequestError } from "../../../errors";

export const getTemplatePageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { templateSlug, linkingId } = getTemplatePageParams.parse(req.params);

    const result = await getTemplatePage(templateSlug, linkingId);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid request data";
      return next(new BadRequestError(message));
    }
    next(error);
  }
};
