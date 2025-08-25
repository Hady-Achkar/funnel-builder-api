import { z } from "zod";

export const loginRequest = z.object({
  identifier: z
    .string({
      message: "Identifier must be a string",
    })
    .trim()
    .toLowerCase()
    .min(1, "Identifier is required"),
  password: z
    .string({
      message: "Password must be a string",
    })
    .min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginRequest>;

export const loginResponse = z.object({
  message: z.string(),
  token: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    username: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    isAdmin: z.boolean(),
  }),
});

export type LoginResponse = z.infer<typeof loginResponse>;