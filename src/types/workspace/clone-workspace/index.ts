import { z } from "zod";
import { UserPlan } from "../../../generated/prisma-client";

/**
 * Request schema for cloning a workspace
 * Called from subscription webhook after successful workspace purchase
 */
export const CloneWorkspaceRequest = z.object({
  sourceWorkspaceId: z
    .number({ message: "Source workspace ID must be a valid number" })
    .int({ message: "Source workspace ID must be a whole number" })
    .positive({ message: "Source workspace ID must be greater than 0" }),
  newOwnerId: z
    .number({ message: "New owner ID must be a valid number" })
    .int({ message: "New owner ID must be a whole number" })
    .positive({ message: "New owner ID must be greater than 0" }),
  paymentId: z
    .string({ message: "Payment ID must be provided as a string" })
    .min(1, { message: "Payment ID cannot be empty" }),
  planType: z.nativeEnum(UserPlan, {
    message: "Plan type must be either BUSINESS or AGENCY",
  }),
});

export type CloneWorkspaceRequest = z.infer<typeof CloneWorkspaceRequest>;

/**
 * Response schema for workspace cloning
 * Returns details of the cloned workspace
 */
export const CloneWorkspaceResponse = z.object({
  message: z.string(),
  clonedWorkspaceId: z.number(),
  clonedWorkspace: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    planType: z.nativeEnum(UserPlan),
  }),
  cloneRecordId: z.number(),
});

export type CloneWorkspaceResponse = z.infer<typeof CloneWorkspaceResponse>;
