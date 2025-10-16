import jwt from "jsonwebtoken";
import {
  GenerateAffiliateLinkRequest,
  GenerateAffiliateLinkResponse,
} from "../../../types/affiliate/generate-affiliate-link";
import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors";

export class AffiliateLinkService {
  static async generateLink(
    userId: number,
    data: GenerateAffiliateLinkRequest
  ): Promise<GenerateAffiliateLinkResponse> {
    const prisma = getPrisma();

    // 1. GET USER COMMISSION PERCENTAGE
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        commissionPercentage: true,
      },
    });

    // User should always exist (authenticated by controller)
    if (!user) {
      throw new Error("User not found - this should not happen");
    }

    // 2. VALIDATE WORKSPACE EXISTS AND USER OWNS IT
    const workspace = await prisma.workspace.findFirst({
      where: {
        slug: data.workspaceSlug,
        ownerId: userId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!workspace) {
      throw new BadRequestError(
        "Workspace not found or you don't have permission to create affiliate links for it"
      );
    }

    // 3. CHECK FOR DUPLICATE LINK NAME
    const existingLink = await prisma.affiliateLink.findFirst({
      where: {
        userId: userId,
        name: data.name,
      },
    });

    if (existingLink) {
      throw new BadRequestError(
        `You already have an affiliate link named "${data.name}". Please choose a different name`
      );
    }

    // 4. VALIDATE JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    // 5. CREATE AFFILIATE LINK (without token first)
    const affiliateLink = await prisma.affiliateLink.create({
      data: {
        name: data.name,
        token: "", // Will be updated after JWT generation
        itemType: data.planType, // Uses default BUSINESS or provided value
        userId,
        workspaceId: workspace.id, // Use the resolved workspace ID
        settings: data.settings,
      },
    });

    // 6. GENERATE JWT TOKEN
    const tokenPayload = {
      userId,
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
      name: data.name,
      planType: data.planType,
      commissionPercentage: user.commissionPercentage,
      settings: data.settings,
      affiliateLinkId: affiliateLink.id,
    };

    const token = jwt.sign(tokenPayload, jwtSecret);

    // 7. UPDATE AFFILIATE LINK WITH TOKEN
    await prisma.affiliateLink.update({
      where: { id: affiliateLink.id },
      data: { token },
    });

    // 8. GENERATE AFFILIATE URL
    const baseUrl = process.env.FRONTEND_URL;
    if (!baseUrl) {
      throw new Error("FRONTEND_URL is not configured");
    }

    const affiliateUrl = `${baseUrl}/register?affiliate=${token}`;

    // 9. RETURN RESPONSE
    return {
      message: "Affiliate link created successfully",
      id: affiliateLink.id,
      url: affiliateUrl,
      token,
    };
  }
}
