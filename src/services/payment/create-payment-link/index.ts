import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors/http-errors";
import {
  createPaymentLinkRequest,
  CreatePaymentLinkRequest,
  CreatePaymentLinkResponse,
} from "../../../types/payment/create-payment-link";

export class CreatePaymentLinkService {
  static async createPaymentLink(
    requestData: CreatePaymentLinkRequest
  ): Promise<CreatePaymentLinkResponse> {
    try {
      const validatedData = createPaymentLinkRequest.parse(requestData);

      const existingUser = await getPrisma().user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        throw new BadRequestError("User with this email already exists");
      }

      let affiliateLink = null;
      if (validatedData.affiliateToken) {
        affiliateLink = await getPrisma().affiliateLink.findUnique({
          where: { token: validatedData.affiliateToken },
        });
        if (!affiliateLink) {
          throw new BadRequestError("Invalid affiliate token");
        }
      }

      const trialEndDate = new Date();
      trialEndDate.setDate(
        trialEndDate.getDate() + validatedData.freeTrialPeriodInDays
      );

      const mamoPayPayload = {
        title: validatedData.planTitle,
        description: validatedData.planDescription,
        amount: validatedData.amount,
        amount_currency: "USD",
        enable_customer_details: true,
        enable_quantity: false,
        enable_tips: false,
        return_url: validatedData.returnUrl,
        failure_return_url: validatedData.failureReturnUrl,
        terms_and_conditions_url: validatedData.termsAndConditionsUrl,
        custom_data: {
          details: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            planType: validatedData.planType,
            frequency: validatedData.frequency,
            frequencyInterval: validatedData.frequencyInterval,
            trialDays: validatedData.freeTrialPeriodInDays,
            trialEndDate: trialEndDate.toISOString(),
            funnels: validatedData.maximumFunnelsAllowed,
            subdomains: validatedData.maximumSubdomainsAllowed,
            customDomains: validatedData.maximumCustomDomainsAllowed,
            admins: validatedData.maximumAdminsAllowed,
          },
          ...(affiliateLink && {
            affiliateLink: {
              id: affiliateLink.id,
              token: affiliateLink.token,
              itemType: affiliateLink.itemType,
              userId: affiliateLink.userId,
            },
          }),
        },
      };

      const mamoPayApiUrl = `${process.env.MAMOPAY_API_URL}/manage_api/v1/links`;

      if (!process.env.MAMOPAY_API_URL) {
        throw new Error("MamoPay API URL is not configured");
      }

      if (!process.env.MAMOPAY_API_KEY) {
        throw new Error("MamoPay API key is not configured");
      }

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
        throw new Error(`MamoPay API error: ${response.status} - ${errorText}`);
      }

      const mamoPayData = await response.json();

      const createPaymentLinkResponse: CreatePaymentLinkResponse = {
        message: "Payment link created successfully",
        paymentLink: {
          id: mamoPayData.id,
          url: mamoPayData.link_url,
          paymentUrl: mamoPayData.payment_url,
          title: mamoPayData.title,
          description: mamoPayData.description,
          amount: mamoPayData.amount,
          currency: mamoPayData.amount_currency,
          frequency: validatedData.frequency,
          frequencyInterval: validatedData.frequencyInterval,
          trialPeriodDays: validatedData.freeTrialPeriodInDays,
          active: mamoPayData.active,
          createdDate: mamoPayData.created_date,
          planDetails: {
            planType: validatedData.planType,
            maximumFunnelsAllowed: validatedData.maximumFunnelsAllowed,
            maximumSubdomainsAllowed: validatedData.maximumSubdomainsAllowed,
            maximumCustomDomainsAllowed:
              validatedData.maximumCustomDomainsAllowed,
            maximumAdminsAllowed: validatedData.maximumAdminsAllowed,
          },
        },
      };

      return createPaymentLinkResponse;
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid request data";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}
