import { Request, Response, NextFunction } from "express";
import { updateTemplate } from "../../../services/template/update";
import { updateTemplateRequestBody } from "../../../types/template/update";
import { BadRequestError } from "../../../errors";

export const updateTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      throw new BadRequestError("Valid template ID is required");
    }

    const templateId = parseInt(id);

    const validatedBody = updateTemplateRequestBody.parse(req.body);
    const result = await updateTemplate({ id: templateId, ...validatedBody });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};