import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { configureWorkspace } from "../../../services/workspace/configure";
import { HttpError } from "../../../errors/http-errors";

export class ConfigureWorkspaceController {
  static async configure(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId as number;
      const result = await configureWorkspace(userId, req.body);
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