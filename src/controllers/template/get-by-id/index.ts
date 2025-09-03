import { Request, Response, NextFunction } from "express";
import { getTemplateById } from "../../../services/template/get-by-id";
import { BadRequestError } from "../../../errors";

export const getTemplateByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      throw new BadRequestError("Valid template ID is required");
    }

    const result = await getTemplateById({ id: parseInt(id) });

    res.status(200).json({
      success: true,
      message: "Template retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};