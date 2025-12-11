import { z } from "zod";

/**
 * Update Funnel Password Request Schema
 *
 * Used to change the password of a locked (password-protected) funnel
 * Only requires new password - no verification of current password needed
 */
export const updatePasswordRequestSchema = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
  funnelSlug: z.string().min(1, "Funnel slug is required"),

  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(100, "New password must be less than 100 characters")
    .transform((val) => val.trim()),
});

export type UpdatePasswordRequest = z.infer<
  typeof updatePasswordRequestSchema
>;

/**
 * Update Funnel Password Response Schema
 */
export const updatePasswordResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
});

export type UpdatePasswordResponse = z.infer<
  typeof updatePasswordResponseSchema
>;

// Export for backward compatibility
export const updatePasswordRequest = updatePasswordRequestSchema;
export const updatePasswordResponse = updatePasswordResponseSchema;
