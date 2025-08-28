import { Request, Response, NextFunction } from "express";
import { ForgotPasswordService } from "../service";

export const forgotPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await ForgotPasswordService.forgotPassword(req.body);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};