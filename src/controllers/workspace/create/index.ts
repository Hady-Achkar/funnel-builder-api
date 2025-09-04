import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { CreateWorkspaceService } from "../../../services/workspace/create";

export class CreateWorkspaceController {
  static async create(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      
      const result = await CreateWorkspaceService.create(userId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}