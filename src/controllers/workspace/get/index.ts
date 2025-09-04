import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetWorkspaceService } from "../../../services/workspace/get";

export class GetWorkspaceController {
  static async getBySlug(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { slug } = req.params;

      const result = await GetWorkspaceService.getBySlug(userId, slug);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}