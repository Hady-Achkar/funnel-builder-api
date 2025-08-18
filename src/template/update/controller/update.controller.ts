import { Request, Response, NextFunction } from "express";
import { updateTemplate } from "../service";
import { updateTemplateRequestBody } from "../types";
import { BadRequestError } from "../../../errors";

export const updateTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    if (!id || isNaN(parseInt(id))) {
      throw new BadRequestError("Valid template ID is required");
    }

    const bodyData = {
      ...req.body,
      ...(files?.thumbnail?.[0] && {
        thumbnail: `/uploads/templates/${id}/thumbnail/${
          files.thumbnail[0].filename || files.thumbnail[0].originalname
        }`,
      }),
      ...(files?.images?.length && {
        images: files.images.map(
          (file, i) =>
            `/uploads/templates/${id}/images/${i}_${
              file.filename || file.originalname
            }`
        ),
      }),
    };

    const validatedBody = updateTemplateRequestBody.parse(bodyData);
    const result = await updateTemplate({ id: parseInt(id), ...validatedBody });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
