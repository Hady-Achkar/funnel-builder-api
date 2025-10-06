import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../../middleware/auth";
import { CreateWorkspaceService } from "../../../services/workspace/create";
import { createWorkspaceRequest } from "../../../types/workspace/create";
import { BadRequestError } from "../../../errors/http-errors";
export class CreateWorkspaceController {
  static async create(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;

      // 1. VALIDATE REQUEST SCHEMA with Zod
      const validatedData = createWorkspaceRequest.parse(req.body);

      // 2. CALL SERVICE (service handles all business validation)
      const result = await CreateWorkspaceService.create(userId, validatedData);

      // 3. SEND SUCCESS RESPONSE
      res.status(201).json(result);
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        return next(new BadRequestError(error.issues[0].message));
      }
      // All other errors (BadRequestError, etc.) pass through
      next(error);
    }
  }
}
