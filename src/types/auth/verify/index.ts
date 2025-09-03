import { z } from "zod";

export const verifyEmailRequest = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const verifyEmailResponse = z.object({
  message: z.string(),
  verified: z.boolean(),
});

// Internal service response includes token for cookie setting
export const verifyEmailServiceResponse = z.object({
  message: z.string(),
  verified: z.boolean(),
  token: z.string(),
});

export type VerifyEmailRequest = z.infer<typeof verifyEmailRequest>;
export type VerifyEmailResponse = z.infer<typeof verifyEmailResponse>;
export type VerifyEmailServiceResponse = z.infer<typeof verifyEmailServiceResponse>;