import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const GenerateAffiliateLinkRequest = z.object({
  name: z.string().min(1, "Name is required"),
  funnelId: z.number().min(1, "Funnel ID is required"),
  planType: z.nativeEnum($Enums.UserPlan, {
    message: `Plan type must be one of: ${Object.values($Enums.UserPlan).join(
      ", "
    )}`,
  }),
  affiliateAmount: z.number().positive("Affiliate amount must be positive"),
  settings: z.record(z.string(), z.any()).optional().default({}),
});

export type GenerateAffiliateLinkRequest = z.infer<
  typeof GenerateAffiliateLinkRequest
>;

export const GenerateAffiliateLinkResponse = z.object({
  message: z.string(),
  id: z.number(),
  url: z.string(),
});

export type GenerateAffiliateLinkResponse = z.infer<
  typeof GenerateAffiliateLinkResponse
>;
