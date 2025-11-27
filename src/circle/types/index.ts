import { z } from "zod";

/**
 * Circle API configuration
 */
export interface CircleConfig {
  apiToken: string;
  communityId: string;
}

/**
 * Data required to invite a member to Circle community
 */
export const CircleMemberDataSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export type CircleMemberData = z.infer<typeof CircleMemberDataSchema>;

/**
 * Response from Circle API when inviting a member
 */
export interface CircleInviteResponse {
  id: number;
  email: string;
  name: string;
  community_id: number;
  created_at: string;
}

/**
 * Error response from Circle API
 */
export interface CircleErrorResponse {
  message?: string;
  errors?: string[];
}
