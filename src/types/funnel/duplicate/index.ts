import { z } from "zod";

export const duplicateFunnelParams = z.object({
  funnelId: z
    .number({ message: "Funnel ID must be a number" })
    .int({ message: "Funnel ID must be an integer" })
    .positive({ message: "Funnel ID must be positive" }),
});

export const duplicateFunnelRequest = z.object({
  name: z
    .string()
    .min(1, { message: "Funnel name cannot be empty" })
    .max(255, { message: "Funnel name cannot exceed 255 characters" })
    .optional(),
  workspaceId: z
    .number()
    .int({ message: "Workspace ID must be an integer" })
    .positive({ message: "Workspace ID must be positive" })
    .optional(),
});

// Helper function to generate default name with timestamp
export const generateDefaultFunnelName = (): string => {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `Copy ${day}.${month}.${year} ${hours}:${minutes}`;
};

export const duplicateFunnelResponse = z.object({
  message: z.string(),
  funnelId: z.number(),
});

export type DuplicateFunnelParams = z.infer<typeof duplicateFunnelParams>;
export type DuplicateFunnelRequest = z.infer<typeof duplicateFunnelRequest>;
export type DuplicateFunnelResponse = z.infer<typeof duplicateFunnelResponse>;