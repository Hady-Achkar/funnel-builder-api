import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { AssociateDomainService } from "../../../services/domain/associate";

export class AssociateDomainController {
  static async associate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized: User ID is required" });
        return;
      }

      const requestData = {
        id: req.params.id,
        routeName: req.body?.routeName,
      };

      const result = await AssociateDomainService.associate(userId, requestData);

      res.status(200).json(result);
    } catch (error: unknown) {
      next(error);
    }
  }
}
