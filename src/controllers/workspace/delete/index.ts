import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { DeleteWorkspaceService } from "../../../services/workspace/delete";

export class DeleteWorkspaceController {
  static async deleteBySlug(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { slug } = req.params;

      const result = await DeleteWorkspaceService.deleteBySlug(userId, slug);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}