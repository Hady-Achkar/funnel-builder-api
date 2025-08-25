import { Request, Response, NextFunction } from "express";
import { LoginService } from "../service/login.service";

export class LoginController {
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await LoginService.login(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}