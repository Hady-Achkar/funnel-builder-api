import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetFreshUserDataService } from "../../../services/auth/get-fresh-user-data";
import { getFreshUserDataResponse } from "../../../types/auth/get-fresh-user-data";
import { UnauthorizedError } from "../../../errors/http-errors";

export class GetFreshUserDataController {
  static async getFreshUserData(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const userData = await GetFreshUserDataService.getFreshUserData(userId);

      if (!userData) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const response = getFreshUserDataResponse.parse(userData);

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
