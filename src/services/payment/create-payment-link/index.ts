import {
  CreatePaymentLinkRequest,
  CreatePaymentLinkResponse,
} from "../../../types/payment/create-payment-link";
import { BadRequestError } from "../../../errors/http-errors";

// Type for processed affiliate data from controller
interface AffiliateData {
  id: number;
  token: string;
  itemType: string;
  userId: number;
  commissionPercentage: number;
  workspaceId?: number; // If WORKSPACE_PURCHASE
}

// Type for workspace data from controller
interface WorkspaceData {
  id: number;
  name: string;
  slug: string;
}

// Type for user data from authenticated token
interface UserData {
  email: string;
  firstName: string;
  lastName: string;
}

export class CreatePaymentLinkService {
  static async createPaymentLink(
    data: CreatePaymentLinkRequest,
    userData: UserData,
    affiliateData: AffiliateData | null,
    workspaceData: WorkspaceData | null
  ): Promise<CreatePaymentLinkResponse> {
    try {
      // 1. VALIDATE ENV VARIABLES
      if (!process.env.MAMOPAY_API_URL) {
        throw new Error("MamoPay API URL is not configured");
      }
      if (!process.env.MAMOPAY_API_KEY) {
        throw new Error("MamoPay API key is not configured");
      }

      // 2. CALCULATE TRIAL END DATE
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + data.freeTrialPeriodInDays);

      // 3. BUILD CUSTOM_DATA (Max 5 objects!)
      const customData: any = {
        // Object 1: All buyer and payment details
        details: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          planType: data.planType,
          paymentType: data.paymentType,
          frequency: data.frequency,
          frequencyInterval: data.frequencyInterval,
          trialDays: data.freeTrialPeriodInDays,
          trialEndDate: trialEndDate.toISOString(),
        },
      };

      // Add workspace info if WORKSPACE_PURCHASE
      if (workspaceData) {
        customData.details.workspaceId = workspaceData.id;
        customData.details.workspaceName = workspaceData.name;
      }

      // Object 2: Affiliate data (if present)
      if (affiliateData) {
        customData.affiliateLink = {
          id: affiliateData.id,
          token: affiliateData.token,
          itemType: affiliateData.itemType,
          userId: affiliateData.userId,
          commissionPercentage: affiliateData.commissionPercentage,
        };

        // Add workspaceId for workspace purchases
        if (affiliateData.workspaceId) {
          customData.affiliateLink.workspaceId = affiliateData.workspaceId;
        }
      }

      // 4. BUILD MAMOPAY PAYLOAD
      const mamoPayPayload = {
        title: data.planTitle,
        description: data.planDescription,
        amount: data.amount,
        amount_currency: "USD",
        enable_customer_details: true,
        enable_quantity: false,
        enable_tips: false,
        return_url: data.returnUrl,
        failure_return_url: data.failureReturnUrl,
        terms_and_conditions_url: data.termsAndConditionsUrl,
        custom_data: customData,
        // Subscription structure for MamoPay recurring payments
        subscription: {
          frequency: data.frequency, // "annually", "monthly", "weekly"
          frequency_interval: data.frequencyInterval, // 1, 2, 3, etc.
        },
        // Processing fee percentage
        processing_fee_percentage: 2,
      };

      // 5. CALL MAMOPAY API
      const mamoPayApiUrl = `${process.env.MAMOPAY_API_URL}/manage_api/v1/links`;

      console.log(
        "[CreatePaymentLink] Sending to MamoPay:",
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
        console.error("[CreatePaymentLink] MamoPay error response:", {
          status: response.status,
          body: errorText,
        });
        throw new BadRequestError(
          `Payment link creation failed. MamoPay error (${response.status}): ${errorText}`
        );
      }

      const mamoPayData = await response.json();

      // 6. BUILD RESPONSE
      return {
        message: "Payment link created successfully",
        paymentLink: {
          id: mamoPayData.id,
          url: mamoPayData.link_url,
          paymentUrl: mamoPayData.payment_url,
          title: mamoPayData.title,
          description: mamoPayData.description,
          amount: mamoPayData.amount,
          currency: mamoPayData.amount_currency,
          frequency: data.frequency,
          frequencyInterval: data.frequencyInterval,
          trialPeriodDays: data.freeTrialPeriodInDays,
          active: mamoPayData.active,
          createdDate: mamoPayData.created_date,
          planType: data.planType,
        },
      };
    } catch (error) {
      // Re-throw errors to be handled by global error handler
      throw error;
    }
  }
}
