import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { deleteForm } from "../../../services/form/delete";
import { UnauthorizedError, BadRequestError } from "../../../errors";

export const deleteFormController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const formId = parseInt(req.params.id);
    if (isNaN(formId)) {
      throw new BadRequestError("Invalid form ID");
    }

    const result = await deleteForm(userId, formId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};