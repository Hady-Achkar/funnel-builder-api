import { z } from "zod";

export const deleteFormResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
});

export type DeleteFormResponse = z.infer<typeof deleteFormResponse>;