import { Request, Response, NextFunction } from "express";
import { clearAuthCookie } from "../../../lib/cookies";

export class LogoutController {
  static async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      clearAuthCookie(res);
      res.status(200).json({
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}