import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { RegisterService } from "../../../services/auth/register";
import { registerRequest } from "../../../types/auth/register";
import { BadRequestError } from "../../../errors";

export class RegisterController {
  static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate request data
      const validatedData = registerRequest.parse(req.body);

      const result = await RegisterService.register(validatedData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        const errorMessage = firstError
          ? firstError.message
          : "Invalid request data";
        next(new BadRequestError(errorMessage));
      } else {
        next(error);
      }
    }
  }
}