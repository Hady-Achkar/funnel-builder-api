import { Request, Response, NextFunction } from "express";
import { RegisterService } from "../../../services/auth/register";

export class RegisterController {
  static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await RegisterService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}