import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { createAddonPaymentLinkRequest } from "../../../types/payment/create-addon-payment-link";
import { CreateAddonPaymentLinkService } from "../../../services/payment/create-addon-payment-link";
import { BadRequestError } from "../../../errors";
import { getPrisma } from "../../../lib/prisma";
import { AuthRequest } from "../../../middleware/auth";
import { PaymentLinkPricing } from "../../../utils/pricing";
import { $Enums } from "../../../generated/prisma-client";

export class CreateAddonPaymentLinkController {
  static async createAddonPaymentLink(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. VALIDATE REQUEST with Zod
      const validatedData = createAddonPaymentLinkRequest.parse(req.body);

      const prisma = getPrisma();
      const userId = req.userId!; // Guaranteed by authenticateToken middleware

      // 2. FETCH USER DATA from authenticated token
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          verified: true,
          plan: true, // User's plan type for user-level addons
        },
      });

      if (!user) {
        return next(new BadRequestError("User not found. Please login again."));
      }

      // 2a. REJECT if user is not verified
      if (!user.verified) {
        return next(
          new BadRequestError(
            "Please verify your email address before purchasing add-ons. Check your inbox for the verification email."
          )
        );
      }

      // 3. DETERMINE IF WORKSPACE-LEVEL OR USER-LEVEL ADDON
      const isWorkspaceAddon =
        validatedData.addonType !== $Enums.AddOnType.EXTRA_WORKSPACE;

      let workspaceData = null;
      let planTypeForPricing: $Enums.UserPlan;

      if (isWorkspaceAddon) {
        // 3a. WORKSPACE-LEVEL ADDON: Requires workspaceSlug
        if (!validatedData.workspaceSlug) {
          return next(
            new BadRequestError(
              "Workspace slug is required for workspace-level add-ons (EXTRA_ADMIN, EXTRA_FUNNEL, EXTRA_PAGE, EXTRA_DOMAIN)."
            )
          );
        }

        // Fetch workspace and verify user is owner or has MANAGE_WORKSPACE permission
        const workspace = await prisma.workspace.findFirst({
          where: {
            slug: validatedData.workspaceSlug,
            OR: [
              { ownerId: userId }, // User is owner
              {
                members: {
                  some: {
                    userId: userId,
                    status: $Enums.MembershipStatus.ACTIVE,
                    permissions: {
                      has: $Enums.WorkspacePermission.MANAGE_WORKSPACE,
                    },
                  },
                },
              }, // User has MANAGE_WORKSPACE permission
            ],
          },
          select: {
            id: true,
            name: true,
            slug: true,
            planType: true,
          },
        });

        if (!workspace) {
          return next(
            new BadRequestError(
              "Workspace not found or you don't have permission to purchase add-ons for this workspace. You must be the owner or have MANAGE_WORKSPACE permission."
            )
          );
        }

        workspaceData = {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
        };

        planTypeForPricing = workspace.planType;
      } else {
        // 3b. USER-LEVEL ADDON (EXTRA_WORKSPACE): Use user's plan
        if (validatedData.workspaceSlug) {
          return next(
            new BadRequestError(
              "Workspace slug should not be provided for user-level add-ons (EXTRA_WORKSPACE)."
            )
          );
        }

        planTypeForPricing = user.plan;
      }

      // 4. GET PRICING from centralized config
      let pricingConfig;

      if (isWorkspaceAddon) {
        pricingConfig = PaymentLinkPricing.getWorkspaceAddonPricing(
          planTypeForPricing,
          validatedData.addonType
        );
      } else {
        pricingConfig = PaymentLinkPricing.getUserAddonPricing(
          planTypeForPricing,
          validatedData.addonType
        );
      }

      if (!pricingConfig) {
        const errorMessage = PaymentLinkPricing.getDisallowedAddonMessage(
          planTypeForPricing,
          validatedData.addonType
        );
        return next(
          new BadRequestError(
            errorMessage || "This add-on is not available for your plan."
          )
        );
      }

      const metadata = PaymentLinkPricing.getMetadata();

      console.log(
        "[CreateAddonPaymentLink] Pricing config:",
        JSON.stringify(pricingConfig, null, 2)
      );

      // 5. CALL SERVICE with processed data and pricing config
      const result = await CreateAddonPaymentLinkService.createAddonPaymentLink(
        {
          paymentType: "ADDON_PURCHASE", // Implicit for this endpoint
          addonType: validatedData.addonType,
          ...pricingConfig, // Spread pricing config (amount, title, description, frequency, etc.)
          ...metadata, // Spread metadata (returnUrl, failureReturnUrl, termsAndConditionsUrl)
        },
        {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        workspaceData
      );

      // 6. SEND RESPONSE
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
