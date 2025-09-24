import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { GetUserDataService } from "../../../services/auth/get-user-data";
import { getUserDataResponse } from "../../../types/auth/get-user-data";
import { UnauthorizedError } from "../../../errors/http-errors";

export class GetUserDataController {
  static async getUserData(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError("Authentication required");
      }

      const user = await GetUserDataService.getUserData(userId);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const response = getUserDataResponse.parse({ user });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
