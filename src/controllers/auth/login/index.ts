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
      
      // Set HTTP-only cookie
      setAuthCookie(res, result.token);
      
      // Return response without token
      const { token, ...responseWithoutToken } = result;
      res.status(200).json(responseWithoutToken);
    } catch (error) {
      next(error);
    }
  }
}