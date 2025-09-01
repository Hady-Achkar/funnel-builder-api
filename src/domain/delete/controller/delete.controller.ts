import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { DeleteDomainService } from "../service/delete.service";
import { UnauthorizedError } from "../../../errors/http-errors";

export class DeleteDomainController {
  static async delete(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication is required");
      }

      const result = await DeleteDomainService.delete(userId, req.params);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
