import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { UpdateWorkspaceService } from "../../../services/workspace/update";
import { HttpError } from "../../../errors/http-errors";

export class UpdateWorkspaceController {
  static async update(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId as number;
      const workspaceSlug = req.params.slug;
      const requestData = {
        ...req.body,
        workspaceSlug
      };
      const result = await UpdateWorkspaceService.update(userId, requestData);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof HttpError) {
        res.status(error.status).json({
          message: error.message,
        });
        return;
      }

      next(error);
    }
  }
}