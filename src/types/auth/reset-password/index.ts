import { z } from "zod";

export const resetPasswordRequest = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string({
      message: "Password must be a string",
    })
    .min(6, "Password must be at least 6 characters long"),
  confirmPassword: z
    .string({
      message: "Confirm password must be a string",
    })
    .min(6, "Confirm password must be at least 6 characters long"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const resetPasswordResponse = z.object({
  message: z.string(),
});

// Internal service response includes token for cookie setting
export const resetPasswordServiceResponse = z.object({
  message: z.string(),
  token: z.string(),
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequest>;
export type ResetPasswordResponse = z.infer<typeof resetPasswordResponse>;
export type ResetPasswordServiceResponse = z.infer<typeof resetPasswordServiceResponse>;