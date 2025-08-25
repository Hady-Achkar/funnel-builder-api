import { Request, Response, NextFunction } from "express";
import { RegisterService } from "../service/register.service";

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
