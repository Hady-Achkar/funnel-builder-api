import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../middleware/auth";
import { CreateSubdomainService } from "../service/create-subdomain.service";
import { createSubdomainRequest } from "../types/create-subdomain.types";

export class CreateSubdomainController {
  static async create(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId as number;
      
      // Validate request data using Zod
      const requestData = createSubdomainRequest.parse(req.body);

      const result = await CreateSubdomainService.create(userId, requestData);

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        res.status(400).json({
          error: firstError.message || "Invalid request data",
          field: firstError.path.join('.') || 'unknown'
        });
        return;
      }
      next(error);
    }
  }
}