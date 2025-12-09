import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { getTemplatePages } from "../../../services/template/get-pages";
import { getTemplatePagesParams } from "../../../types/template/get-pages";
import { BadRequestError } from "../../../errors";

export const getTemplatePagesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { templateSlug } = getTemplatePagesParams.parse(req.params);

    const result = await getTemplatePages(templateSlug);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid request data";
      return next(new BadRequestError(message));
    }
    next(error);
  }
};
