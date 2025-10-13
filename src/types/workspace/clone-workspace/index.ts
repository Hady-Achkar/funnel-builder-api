import { z } from "zod";
import { UserPlan } from "../../../generated/prisma-client";

/**
 * Request schema for cloning a workspace
 * Called from subscription webhook after successful workspace purchase
 */
export const CloneWorkspaceRequest = z.object({
  sourceWorkspaceId: z.number().int().positive(),
  newOwnerId: z.number().int().positive(),
  paymentId: z.number().int().positive().optional(),
  planType: z.nativeEnum(UserPlan), // Plan type from buyer's subscription
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
