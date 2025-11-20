import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { createPaymentLinkRequest } from "../../../types/payment/create-payment-link";
import { CreatePaymentLinkService } from "../../../services/payment/create-payment-link";
import { BadRequestError } from "../../../errors";
import { getPrisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../../../middleware/auth";
import { PaymentLinkPricing } from "../../../utils/pricing";

export class CreatePaymentLinkController {
  static async createPaymentLink(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. VALIDATE REQUEST with Zod
      const validatedData = createPaymentLinkRequest.parse(req.body);

      const prisma = getPrisma();
      const userId = req.userId!; // Guaranteed by authenticateToken middleware

      // 2. FETCH USER DATA from authenticated token
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          firstName: true,
          lastName: true,
          verified: true,
          registrationSource: true,
          registrationToken: true,
        },
      });

      if (!user) {
        return next(new BadRequestError("User not found. Please login again."));
      }

      // 2a. REJECT if user is not verified
      if (!user.verified) {
        return next(
          new BadRequestError(
            "Please verify your email address before creating a payment link. Check your inbox for the verification email."
          )
        );
      }

      // 3. GET PRICING from centralized config
      const pricingConfig = PaymentLinkPricing.getPlanPurchasePricing(
        user.registrationSource,
        validatedData.planType
      );

      if (!pricingConfig) {
        const errorMessage = PaymentLinkPricing.getDisallowedPlanMessage(
          user.registrationSource,
          validatedData.planType
        );
        return next(new BadRequestError(errorMessage));
      }

      const metadata = PaymentLinkPricing.getMetadata();

      console.log(
        "[CreatePaymentLink] Pricing config:",
        JSON.stringify(pricingConfig, null, 2)
      );

      // 4. GET AFFILIATE TOKEN from user registration (if registered via affiliate)
      let affiliateToken: string | null = null;
      if (user.registrationSource === "AFFILIATE" && user.registrationToken) {
        affiliateToken = user.registrationToken;
        console.log(
          "[CreatePaymentLink] Using affiliateToken from user registration:",
          userId
        );
      }

      // 5. PROCESS AFFILIATE TOKEN (from registration only)
      let affiliateData = null;
      let workspaceData = null;

      if (affiliateToken) {
        // 5a. Validate JWT_SECRET exists
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          return next(
            new BadRequestError(
              "We're experiencing a configuration issue. Please try again later or contact support."
            )
          );
        }

        // 5b. Decode JWT token
        let decoded: any;
        try {
          decoded = jwt.verify(affiliateToken, jwtSecret);
        } catch (error) {
          return next(
            new BadRequestError(
              "The affiliate link appears to be invalid or expired. Please request a new link."
            )
          );
        }

        // 5c. Verify affiliate link exists in database
        const affiliateLink = await prisma.affiliateLink.findUnique({
          where: { token: affiliateToken },
          select: {
            id: true,
            token: true,
            itemType: true,
            userId: true,
            workspaceId: true,
          },
        });

        if (!affiliateLink) {
          return next(
            new BadRequestError(
              "The affiliate link is no longer valid. Please contact the seller for a new link."
            )
          );
        }

        // 5d. Build affiliate data (use commissionPercentage from JWT)
        affiliateData = {
          id: affiliateLink.id,
          token: affiliateLink.token,
          itemType: affiliateLink.itemType,
          userId: affiliateLink.userId,
          commissionPercentage: decoded.commissionPercentage,
        };

        // 5e. If affiliate link contains workspace data, validate the workspace (workspace purchase)
        if (decoded.workspaceId) {
          const workspace = await prisma.workspace.findFirst({
            where: {
              id: decoded.workspaceId,
              ownerId: decoded.userId,
              planType: "AGENCY", // MUST be AGENCY!
            },
            select: {
              id: true,
              name: true,
              slug: true,
            },
          });

          // if (!workspace) {
          //   return next(
          //     new BadRequestError(
          //       "The workspace is not available for purchase. Only Agency workspaces can be sold, and the seller must still own it."
          //     )
          //   );
          // }

          workspaceData = {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
          };

          // Add workspaceId to affiliate data
          affiliateData.workspaceId = workspace.id;
        }
      }

      // 6. CALL SERVICE with processed data and pricing config
      const result = await CreatePaymentLinkService.createPaymentLink(
        {
          paymentType: "PLAN_PURCHASE", // Implicit for this endpoint
          planType: validatedData.planType,
          ...pricingConfig, // Spread pricing config (amount, title, description, frequency, etc.)
          ...metadata, // Spread metadata (returnUrl, failureReturnUrl, termsAndConditionsUrl)
        },
        {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        affiliateData,
        workspaceData
      );

      // 7. SEND RESPONSE
      res.status(200).json(result);
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const friendlyMessage =
          error.issues[0]?.message || "Please check your input and try again";
        return next(new BadRequestError(friendlyMessage));
      }

      // Pass other errors to error handler
      next(error);
    }
  }
}
