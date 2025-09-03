import { z } from "zod";

export const forgotPasswordRequest = z.object({
  email: z
    .string({
      message: "Email must be a string",
    })
    .email("Please provide a valid email address")
    .trim()
    .toLowerCase(),
});

export const forgotPasswordResponse = z.object({
  message: z.string(),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequest>;
export type ForgotPasswordResponse = z.infer<typeof forgotPasswordResponse>;