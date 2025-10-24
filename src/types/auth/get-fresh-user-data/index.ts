import { z } from "zod";
import {
  User,
  UserPlan,
  RegistrationSource,
} from "../../../generated/prisma-client";

export type GetFreshUserDataResponse = Pick<
  User,
  "plan" | "registrationSource" | "registrationToken" | "balance"
>;

export const getFreshUserDataResponse = z.object({
  plan: z.nativeEnum(UserPlan),
  registrationSource: z.nativeEnum(RegistrationSource).nullable(),
  registrationToken: z.string().nullable(),
  balance: z.number(),
});

export type GetFreshUserDataResponseType = z.infer<
  typeof getFreshUserDataResponse
>;
