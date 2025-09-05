import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import { redisService } from "../../cache/redis.service";
import {
  BadRequestError,
  UnauthorizedError,
} from "../../../errors/http-errors";
import {
  trackAffiliateLinkClickRequest,
  TrackAffiliateLinkClickResponse,
  TrackAffiliateLinkClickRequest,
} from "../../../types/affiliate/affiliate-click";

export class AffiliateLinkClickService {
  static async trackClick(
    requestData: TrackAffiliateLinkClickRequest
  ): Promise<TrackAffiliateLinkClickResponse> {
    try {
      const validatedData = trackAffiliateLinkClickRequest.parse(requestData);
      const { token, sessionId } = validatedData;

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("JWT_SECRET is not configured");
      }

      let decodedToken;
      try {
        decodedToken = jwt.verify(token, jwtSecret) as any;
      } catch (error) {
        throw new UnauthorizedError("Invalid affiliate token");
      }

      const { affiliateLinkId } = decodedToken;
      if (!affiliateLinkId) {
        throw new BadRequestError("Invalid token payload");
      }

      const affiliateLink = await getPrisma().affiliateLink.findUnique({
        where: { id: affiliateLinkId },
      });

      if (!affiliateLink) {
        throw new BadRequestError("Affiliate link not found");
      }

      const redisKey = `session:${sessionId}:affiliate:${affiliateLinkId}:clicked`;
      const hasClicked = await redisService.get(redisKey);

      if (hasClicked) {
        throw new BadRequestError(
          "This session has already clicked this affiliate link"
        );
      }

      await getPrisma().affiliateLink.update({
        where: { id: affiliateLinkId },
        data: {
          clickCount: affiliateLink.clickCount + 1,
        },
      });

      await redisService.set(redisKey, "1", 24 * 60 * 60);

      return {
        message: "Click tracked successfully",
      };
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid request data";
        throw new BadRequestError(message);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError("Invalid affiliate token");
      }
      throw error;
    }
  }
}
