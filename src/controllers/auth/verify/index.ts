import { Request, Response, NextFunction } from "express";
import { VerifyService } from "../../../services/auth/verify";
import { setAuthCookie } from "../../../lib/cookies";

export const verifyEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).json({
        error: "Verification token is required",
      });
    }

    const result = await VerifyService.verifyEmail(token);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};
