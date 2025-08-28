import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { DeleteDomainService } from "../service/delete.service";

export class DeleteDomainController {
  static async delete(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId as number;
      const domainId = parseInt(req.params.id);
      
      if (isNaN(domainId)) {
        res.status(400).json({
          error: "Invalid domain ID",
          field: "id"
        });
        return;
      }

      const result = await DeleteDomainService.delete(userId, { id: domainId });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}