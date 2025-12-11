import { Request, Response, NextFunction } from "express";
import { LoginService } from "../../../services/auth/login";
import { setAuthCookie } from "../../../lib/cookies";

export class LoginController {
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await LoginService.login(req.body);

      res.status(200).json({
        message: "Login successful",
        data: {
          token: result.token,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
