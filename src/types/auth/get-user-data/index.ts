import { z } from "zod";
import { User, UserPlan } from "../../../generated/prisma-client";

export type GetUserDataResponse = Pick<
  User,
  | "id"
  | "email"
  | "username"
  | "firstName"
  | "lastName"
  | "avatar"
  | "isAdmin"
  | "plan"
  | "balance"
  | "trialStartDate"
  | "trialEndDate"
  | "createdAt"
  | "updatedAt"
>;

export const getUserDataResponse = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
    username: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    avatar: z.string().nullable(),
    isAdmin: z.boolean(),
    plan: z.nativeEnum(UserPlan),
    balance: z.number(),
    trialStartDate: z.date().nullable(),
    trialEndDate: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

export type GetUserDataResponseType = z.infer<typeof getUserDataResponse>;