import { z } from "zod";
import { User } from "../../../generated/prisma-client";

export type UserProfile = Pick<
  User,
  | "id"
  | "email"
  | "username"
  | "firstName"
  | "lastName"
  | "avatar"
  | "createdAt"
  | "updatedAt"
>;

export const updateUserProfileRequest = z
  .object({
    firstName: z
      .string()
      .min(1, { message: "First name cannot be empty" })
      .max(100, { message: "First name cannot exceed 100 characters" })
      .optional(),
    lastName: z
      .string()
      .min(1, { message: "Last name cannot be empty" })
      .max(100, { message: "Last name cannot exceed 100 characters" })
      .optional(),
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters" })
      .max(50, { message: "Username cannot exceed 50 characters" })
      .regex(/^[a-zA-Z0-9_-]+$/, {
        message:
          "Username can only contain letters, numbers, underscores, and hyphens",
      })
      .optional(),
    avatar: z
      .string()
      .url({ message: "Avatar must be a valid URL" })
      .optional()
      .or(z.literal(null)),
  })
  .refine((data) => !("email" in data), {
    message: "Email updates are not allowed",
  });

export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileRequest>;

export const updateUserProfileResponse = z.object({
  message: z.string(),
  token: z.string(),
});

export type UpdateUserProfileResponse = z.infer<
  typeof updateUserProfileResponse
>;
