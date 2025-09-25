import { z } from "zod";
import { $Enums, WorkspaceRole, WorkspacePermission } from "../../../generated/prisma-client";

export const registerRequest = z.object({
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
    .enum($Enums.UserPlan, {
      message: "Plan must be BUSINESS or AGENCY",
    })
    .default($Enums.UserPlan.BUSINESS),
  invitationToken: z
    .string()
    .optional(),
});

export type RegisterRequest = z.infer<typeof registerRequest>;

export const registerResponse = z.object({
  message: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    username: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    isAdmin: z.boolean().default(false),
    plan: z.enum($Enums.UserPlan),
    verified: z.boolean(),
  }),
  workspace: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    role: z.enum(WorkspaceRole),
    permissions: z.array(z.enum(WorkspacePermission)),
  }).optional(),
});

export type RegisterResponse = z.infer<typeof registerResponse>;
