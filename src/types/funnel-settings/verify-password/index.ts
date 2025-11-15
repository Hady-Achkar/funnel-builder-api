import { z } from "zod";

export const verifyPasswordRequest = z.object({
  hostname: z.string()
    .min(1, "Hostname is required"),
  funnelSlug: z.string()
    .min(1, "Funnel slug is required")
    .regex(/^[a-z0-9-]+$/, "Funnel slug must contain only lowercase letters, numbers, and hyphens"),
  password: z.string()
    .min(1, "Password is required"),
});

export type VerifyPasswordRequest = z.infer<typeof verifyPasswordRequest>;

export const verifyPasswordResponse = z.object({
  valid: z.boolean(),
  message: z.string(),
  funnelId: z.number().optional(), // Included for cookie generation
  sessionToken: z.string().optional(),
});

export type VerifyPasswordResponse = z.infer<typeof verifyPasswordResponse>;