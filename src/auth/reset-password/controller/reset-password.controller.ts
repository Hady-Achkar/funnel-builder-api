import { Request, Response, NextFunction } from "express";
import { ResetPasswordService } from "../service";
import { setAuthCookie } from "../../../lib/cookies";

export const resetPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await ResetPasswordService.resetPassword(req.body);
    
    // Set HTTP-only cookie with the JWT token
    setAuthCookie(res, result.token);
    
    // Return response without token
    const { token, ...responseWithoutToken } = result;

    return res.status(200).json(responseWithoutToken);
  } catch (error) {
    return next(error);
  }
};