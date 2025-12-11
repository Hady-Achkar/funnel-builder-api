import {
  CreateAddonPaymentLinkRequest,
  CreateAddonPaymentLinkResponse,
} from "../../../types/payment/create-addon-payment-link";
import { BadRequestError } from "../../../errors/http-errors";
import { PaymentType, AddOnType } from "../../../generated/prisma-client";

// Type for enriched addon payment link data (includes pricing config)
interface EnrichedAddonPaymentLinkData {
  paymentType: PaymentType;
  addonType: AddOnType;
  amount: number;
  title: string;
  description: string;
  frequency: "monthly" | "annually" | "weekly";
  frequencyInterval: number;
  freeTrialPeriodInDays: number;
  returnUrl: string;
  failureReturnUrl: string;
  termsAndConditionsUrl: string;
}

// Type for user data from authenticated token
interface UserData {
  email: string;
  firstName: string;
  lastName: string;
}

// Type for workspace data (if workspace-level addon)
interface WorkspaceData {
  id: number;
  name: string;
  slug: string;
}

export class CreateAddonPaymentLinkService {
  static async createAddonPaymentLink(
    data: EnrichedAddonPaymentLinkData,
    userData: UserData,
    workspaceData: WorkspaceData | null
  ): Promise<CreateAddonPaymentLinkResponse> {
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

      // 3. BUILD CUSTOM_DATA
      const customData: any = {
        // Object 1: All buyer and payment details
        details: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          addonType: data.addonType,
          paymentType: data.paymentType,
          frequency: data.frequency,
          frequencyInterval: data.frequencyInterval,
          trialDays: data.freeTrialPeriodInDays,
          trialEndDate: trialEndDate.toISOString(),
        },
      };

      // Add workspace info if workspace-level addon
      if (workspaceData) {
        customData.details.workspaceId = workspaceData.id;
        customData.details.workspaceName = workspaceData.name;
      }

      // 4. BUILD MAMOPAY PAYLOAD
      const mamoPayPayload = {
        title: data.title,
        description: data.description,
        amount: data.amount,
        amount_currency: "USD",
        // enable_customer_details: true,
        enable_quantity: false,
        enable_tips: false,
        return_url: data.returnUrl,
        failure_return_url: data.failureReturnUrl,
        terms_and_conditions_url: data.termsAndConditionsUrl,
        custom_data: customData,
        subscription: {
          frequency: data.frequency,
          frequency_interval: data.frequencyInterval,
        },
        processing_fee_percentage: 2,
      };

      // 5. CALL MAMOPAY API
      const mamoPayApiUrl = `${process.env.MAMOPAY_API_URL}/manage_api/v1/links`;

      console.log(
        "[CreateAddonPaymentLink] Sending to MamoPay:",
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
        console.error("[CreateAddonPaymentLink] MamoPay error response:", {
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
        message: "Add-on payment link created successfully",
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
          addonType: data.addonType,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
