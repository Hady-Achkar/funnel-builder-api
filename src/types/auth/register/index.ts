import { z } from "zod";
import {
  WorkspaceRole,
  WorkspacePermission,
  UserPlan,
} from "../../../generated/prisma-client";

export const registerRequestSchema = z.object({
  email: z
    .string({
      message: "Email must be a string",
    })
    .email("Please provide a valid email address")
    .trim()
    .toLowerCase(),
  username: z
    .string({
      message: "Username must be a string",
    })
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters long")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscores"
    ),
  firstName: z
    .string({
      message: "First name must be a string",
    })
    .trim()
    .min(1, "First name cannot be empty")
    .max(100, "First name must be less than 100 characters"),
  lastName: z
    .string({
      message: "Last name must be a string",
    })
    .trim()
    .min(1, "Last name cannot be empty")
    .max(100, "Last name must be less than 100 characters"),
  password: z
    .string({
      message: "Password must be a string",
    })
    .min(6, "Password must be at least 6 characters long"),
  isAdmin: z
    .boolean({
      message: "isAdmin must be a boolean",
    })
    .default(false),
  plan: z
    .nativeEnum(UserPlan)
    .default(UserPlan.FREE)
    .describe("Plan must be FREE, BUSINESS or AGENCY"),
  trialPeriod: z
    .string()
    .regex(/^\d+[ymwd]$/i, {
      message:
        "Trial period must be in format: 1y, 2m, 3w, 30d (year/month/week/day)",
    })
    .optional()
    .describe(
      "Optional trial period. Format: 1y, 2m, 3w, 30d. Defaults to 6y if not provided"
    ),
  workspaceInvitationToken: z
    .string({message: "Workspace invitation token must be a string"})
    .min(1, "Workspace invitation token cannot be empty")
    .optional(),
});

// User response schema using Prisma types inside Zod
export const registerUserResponseSchema = z
  .object({
    id: z.number(),
    email: z.string(),
    username: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    isAdmin: z.boolean(),
    plan: z.nativeEnum(UserPlan),
    verified: z.boolean(),
  })
  .describe("User data from Prisma User model");

// Workspace response schema using Prisma types inside Zod
export const registerWorkspaceResponseSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    role: z.nativeEnum(WorkspaceRole),
    permissions: z.array(z.nativeEnum(WorkspacePermission)),
  })
  .describe(
    "Workspace data from Prisma Workspace model with role and permissions"
  );

// Complete response schema
export const registerResponseSchema = z.object({
  message: z.string(),
  user: registerUserResponseSchema,
  workspace: registerWorkspaceResponseSchema.optional(),
});

// Export inferred TypeScript types from Zod schemas
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type RegisterUserResponse = z.infer<typeof registerUserResponseSchema>;
export type RegisterWorkspaceResponse = z.infer<
  typeof registerWorkspaceResponseSchema
>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;

// For backward compatibility, export the request schema with the old name
export const registerRequest = registerRequestSchema;
