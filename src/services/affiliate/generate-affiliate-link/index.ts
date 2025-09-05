import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import {
  GenerateAffiliateLinkRequest,
  GenerateAffiliateLinkResponse,
} from "../../../types/affiliate/generate-affiliate-link";
import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors";

export class AffiliateLinkService {
  static async generateLink(
    userId: number,
    requestData: GenerateAffiliateLinkRequest
  ): Promise<GenerateAffiliateLinkResponse> {
    try {
      const { name, funnelId, planType, settings } = requestData;
      const user = await getPrisma().user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new BadRequestError("User not found");
      }

      const funnel = await getPrisma().funnel.findFirst({
        where: {
          id: funnelId,
          createdBy: userId,
        },
      });
      if (!funnel) {
        throw new BadRequestError("Funnel not found or access denied");
      }

      const existingLink = await getPrisma().affiliateLink.findFirst({
        where: {
          userId: userId,
          name: name,
        },
      });
      if (existingLink) {
        throw new BadRequestError(
          "An affiliate link with this name already exists"
        );
      }

      const affiliateLink = await getPrisma().affiliateLink.create({
        data: {
          name,
          token: "",
          itemType: planType,
          userId,
          settings: settings || {},
        },
      });

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("JWT_SECRET is not configured");
      }

      const tokenPayload = {
        userId,
        funnelId,
        name,
        settings,
        affiliateLinkId: affiliateLink.id,
      };

      const token = jwt.sign(tokenPayload, jwtSecret);

      const updatedAffiliateLink = await getPrisma().affiliateLink.update({
        where: { id: affiliateLink.id },
        data: { token },
      });

      const baseUrl = process.env.FRONTEND_URL;
      const affiliateUrl = `${baseUrl}/affiliate?affiliate=${token}`;

      const response: GenerateAffiliateLinkResponse = {
        message: "Affiliate link generated successfully",
        id: updatedAffiliateLink.id,
        url: affiliateUrl,
      };

      return response;
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid request data";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}
