import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { deleteTemplate } from "../service";
import { UnauthorizedError, BadRequestError } from "../../../errors";

export const deleteTemplateController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      throw new BadRequestError("Valid template ID is required");
    }

    const result = await deleteTemplate(userId, parseInt(id));

    res.status(200).json({
      success: true,
      message: result.message,
      data: { deletedTemplateId: result.deletedTemplateId }
    });
  } catch (error) {
    next(error);
  }
};