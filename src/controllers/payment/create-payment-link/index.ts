import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { createPaymentLinkRequest } from "../../../types/payment/create-payment-link";
import { CreatePaymentLinkService } from "../../../services/payment/create-payment-link";
import { BadRequestError } from "../../../errors";
import { getPrisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";

export class CreatePaymentLinkController {
  static async createPaymentLink(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. VALIDATE REQUEST with Zod
      const validatedData = createPaymentLinkRequest.parse(req.body);

      const prisma = getPrisma();

      // 2. CHECK BUYER EMAIL DOESN'T EXIST
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
        select: { email: true },
      });

      if (existingUser) {
        return next(
          new BadRequestError(
            "An account with this email already exists. Please use a different email address."
          )
        );
      }

      // 3. PROCESS AFFILIATE TOKEN (if provided)
      let affiliateData = null;
      let workspaceData = null;

      if (validatedData.affiliateToken) {
        // 3a. Validate JWT_SECRET exists
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          return next(
            new BadRequestError(
              "We're experiencing a configuration issue. Please try again later or contact support."
            )
          );
        }

        // 3b. Decode JWT token
        let decoded: any;
        try {
          decoded = jwt.verify(validatedData.affiliateToken, jwtSecret);
        } catch (error) {
          return next(
            new BadRequestError(
              "The affiliate link appears to be invalid or expired. Please request a new link."
            )
          );
        }

        // 3c. Verify affiliate link exists in database
        const affiliateLink = await prisma.affiliateLink.findUnique({
          where: { token: validatedData.affiliateToken },
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

        // 3d. Build affiliate data (use commissionPercentage from JWT)
        affiliateData = {
          id: affiliateLink.id,
          token: affiliateLink.token,
          itemType: affiliateLink.itemType,
          userId: affiliateLink.userId,
          commissionPercentage: decoded.commissionPercentage,
        };

        // 3e. If WORKSPACE_PURCHASE, validate workspace
        if (validatedData.paymentType === "WORKSPACE_PURCHASE") {
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

          if (!workspace) {
            return next(
              new BadRequestError(
                "The workspace is not available for purchase. Only Agency workspaces can be sold, and the seller must still own it."
              )
            );
          }

          workspaceData = {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
          };

          // Add workspaceId to affiliate data
          affiliateData.workspaceId = workspace.id;
        }
      } else {
        // 3f. WORKSPACE_PURCHASE requires affiliate token
        if (validatedData.paymentType === "WORKSPACE_PURCHASE") {
          return next(
            new BadRequestError(
              "Workspace purchases require an affiliate link. Please use a valid workspace purchase link."
            )
          );
        }
      }

      // 4. CALL SERVICE with processed data
      const result = await CreatePaymentLinkService.createPaymentLink(
        validatedData,
        affiliateData,
        workspaceData
      );

      // 5. SEND RESPONSE
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
