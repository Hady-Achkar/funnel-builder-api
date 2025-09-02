import { z } from "zod";

export const verifyPasswordRequest = z.object({
  funnelId: z.number()
    .int("Funnel ID must be an integer")
    .positive("Funnel ID must be a positive number"),
  password: z.string()
    .min(1, "Password is required"),
});

export type VerifyPasswordRequest = z.infer<typeof verifyPasswordRequest>;

export const verifyPasswordResponse = z.object({
  valid: z.boolean(),
  message: z.string(),
  sessionToken: z.string().optional(),
});

export type VerifyPasswordResponse = z.infer<typeof verifyPasswordResponse>;