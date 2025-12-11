import { z } from "zod";

export const trackAffiliateLinkClickRequest = z.object({
  token: z.string().min(1, "Affiliate token is required"),
  sessionId: z.string().min(1, "Session ID is required"),
});

export type TrackAffiliateLinkClickRequest = z.infer<
  typeof trackAffiliateLinkClickRequest
>;

export const trackAffiliateLinkClickResponse = z.object({
  message: z.string(),
});

export type TrackAffiliateLinkClickResponse = z.infer<
  typeof trackAffiliateLinkClickResponse
>;
