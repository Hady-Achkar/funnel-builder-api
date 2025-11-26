import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  createPaymentLinkRequest,
  createPartnerPaymentLinkRequest,
} from "../../../types/payment/create-payment-link";
import { CreatePaymentLinkService } from "../../../services/payment/create-payment-link";
import { BadRequestError } from "../../../errors";
import { getPrisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../../../middleware/auth";
import { PaymentLinkPricing } from "../../../utils/pricing";
import { PaymentType, UserPlan } from "../../../generated/prisma-client";

export class CreatePaymentLinkController {
  /**
   * Create payment link - handles both:
   * 1. Authenticated users (existing behavior)
   * 2. Public Partner Plan requests (when plan: "partner" is passed)
   */
  static async createPaymentLink(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const prisma = getPrisma();

      // Check if this is a Partner Plan request (public, unauthenticated)
      if (req.body.plan === "partner") {
        return await CreatePaymentLinkController.handlePartnerPlanRequest(
          req,
          res,
          next
        );
      }

      // Otherwise, require authentication
      if (!req.userId) {
        return next(
          new BadRequestError(
            "Authentication required. Please login to create a payment link."
          )
        );
      }

      // 1. VALIDATE REQUEST with Zod
      const validatedData = createPaymentLinkRequest.parse(req.body);

      const userId = req.userId;

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

  /**
   * Handle Partner Plan request (public, payment-first registration)
   * User pays first, then gets auto-registered on webhook
   * User details (firstName, lastName, email, phone) come from MamoPay after payment
   */
  private static async handlePartnerPlanRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // 1. VALIDATE REQUEST - only plan: "partner" required
    createPartnerPaymentLinkRequest.parse(req.body);

    console.log("[CreatePaymentLink] Partner Plan request received");

    // 2. GET PRICING CONFIG FOR PARTNER PLAN (AGENCY from AD source)
    const pricingConfig = PaymentLinkPricing.getPlanPurchasePricing(
      "AD",
      UserPlan.AGENCY
    );

    if (!pricingConfig) {
      return next(new BadRequestError("Partner Plan pricing not configured"));
    }

    const metadata = PaymentLinkPricing.getMetadata();

    // 3. VALIDATE ENV VARIABLES
    if (!process.env.MAMOPAY_API_URL) {
      throw new Error("MamoPay API URL is not configured");
    }
    if (!process.env.MAMOPAY_API_KEY) {
      throw new Error("MamoPay API key is not configured");
    }

    // 4. BUILD CUSTOM_DATA (no userId - indicates payment-first flow)
    // User details will come from MamoPay's customer_details in the webhook
    const customData = {
      details: {
        planType: UserPlan.AGENCY,
        paymentType: PaymentType.PLAN_PURCHASE,
        frequency: pricingConfig.frequency,
        frequencyInterval: pricingConfig.frequencyInterval,
        trialDays: pricingConfig.freeTrialPeriodInDays,
        trialEndDate: new Date().toISOString(),
      },
      // Partner plan specific data
      isPartnerPlan: true,
      plan: "partner",
      registrationSource: "AD",
    };

    // 5. BUILD MAMOPAY PAYLOAD
    // enable_customer_details: true - MamoPay will collect user details
    const mamoPayPayload = {
      title: pricingConfig.title,
      description: pricingConfig.description,
      amount: pricingConfig.amount,
      amount_currency: "USD",
      enable_customer_details: true,
      enable_quantity: false,
      enable_tips: false,
      return_url: metadata.returnUrl,
      failure_return_url: metadata.failureReturnUrl,
      terms_and_conditions_url: metadata.termsAndConditionsUrl,
      custom_data: customData,
      ...(pricingConfig.isSubscription && {
        subscription: {
          frequency: pricingConfig.frequency,
          frequency_interval: pricingConfig.frequencyInterval,
        },
      }),
      processing_fee_percentage: 2,
    };

    // 6. CALL MAMOPAY API
    const mamoPayApiUrl = `${process.env.MAMOPAY_API_URL}/manage_api/v1/links`;

    console.log(
      "[CreatePaymentLink] Partner Plan - Sending to MamoPay:",
      JSON.stringify(mamoPayPayload, null, 2)
    );

    const response = await fetch(mamoPayApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MAMOPAY_API_KEY}`,
      },
      body: JSON.stringify(mamoPayPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[CreatePaymentLink] Partner Plan - MamoPay error:", {
        status: response.status,
        body: errorText,
      });
      return next(
        new BadRequestError(
          "Payment link creation failed. Please try again later."
        )
      );
    }

    const mamoPayData = await response.json();

    console.log("[CreatePaymentLink] Partner Plan - Payment link created:", {
      linkId: mamoPayData.id,
    });

    // 7. RETURN RESPONSE
    res.status(200).json({
      message: "Payment link created successfully",
      paymentLink: {
        id: mamoPayData.id,
        url: mamoPayData.link_url,
        paymentUrl: mamoPayData.payment_url,
        title: mamoPayData.title,
        description: mamoPayData.description,
        amount: mamoPayData.amount,
        currency: mamoPayData.amount_currency,
        frequency: pricingConfig.frequency,
        frequencyInterval: pricingConfig.frequencyInterval,
        trialPeriodDays: pricingConfig.freeTrialPeriodInDays,
        active: mamoPayData.active,
        createdDate: mamoPayData.created_date,
        planType: UserPlan.AGENCY,
      },
    });
  }
}
