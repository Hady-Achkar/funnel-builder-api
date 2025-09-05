import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AffiliateLinkClickService } from "../../../services/affiliate/affiliate-click";
import { UnauthorizedError } from "../../../errors/http-errors";

export class AffiliateLinkClickController {
  static async trackClick(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.cookies?.authToken;
      if (token) {
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret) {
          try {
            jwt.verify(token, jwtSecret);
            throw new UnauthorizedError(
              "This endpoint is only for non-authenticated users"
            );
          } catch (jwtError) {
            if (jwtError instanceof UnauthorizedError) {
              throw jwtError;
            }
          }
        }
      }

      const result = await AffiliateLinkClickService.trackClick(req.body);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
