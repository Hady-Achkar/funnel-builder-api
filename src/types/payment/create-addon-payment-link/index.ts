import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const createAddonPaymentLinkRequest = z.object({
  addonType: z.nativeEnum($Enums.AddOnType),
  workspaceSlug: z.string().min(1).optional(),
});

export type CreateAddonPaymentLinkRequest = z.infer<
  typeof createAddonPaymentLinkRequest
>;

export const createAddonPaymentLinkResponse = z.object({
  message: z.string(),
  paymentLink: z.object({
    id: z.string(),
    url: z.string(),
    paymentUrl: z.string(),
    title: z.string(),
    description: z.string(),
    amount: z.number(),
    currency: z.string(),
    frequency: z.enum(["monthly", "annually", "weekly"]),
    frequencyInterval: z.number(),
    trialPeriodDays: z.number(),
    active: z.boolean(),
    createdDate: z.string(),
    addonType: z.nativeEnum($Enums.AddOnType),
  }),
});

export type CreateAddonPaymentLinkResponse = z.infer<
  typeof createAddonPaymentLinkResponse
>;
