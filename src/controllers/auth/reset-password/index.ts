import { Request, Response, NextFunction } from "express";
import { ResetPasswordService } from "../../../services/auth/reset-password";

export const resetPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await ResetPasswordService.resetPassword(req.body);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};
