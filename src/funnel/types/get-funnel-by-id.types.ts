import { z } from "zod";
import { $Enums } from "../../generated/prisma-client";

export const GetFunnelByIdParamsSchema = z.object({
  funnelId: z
    .number({ message: "Funnel ID must be a number" })
    .int({ message: "Funnel ID must be an integer" })
    .positive({ message: "Funnel ID must be positive" }),
});

export const ThemeDataSchema = z.object({
  id: z.number({ message: "Theme ID must be a number" }).int().positive(),
  name: z
    .string({ message: "Theme name is required" })
    .min(1, "Theme name cannot be empty"),
  backgroundColor: z
    .string({ message: "Background color is required" })
    .min(1, "Background color cannot be empty"),
  textColor: z
    .string({ message: "Text color is required" })
    .min(1, "Text color cannot be empty"),
  buttonColor: z
    .string({ message: "Button color is required" })
    .min(1, "Button color cannot be empty"),
  buttonTextColor: z
    .string({ message: "Button text color is required" })
    .min(1, "Button text color cannot be empty"),
  borderColor: z
    .string({ message: "Border color is required" })
    .min(1, "Border color cannot be empty"),
  optionColor: z
    .string({ message: "Option color is required" })
    .min(1, "Option color cannot be empty"),
  fontFamily: z
    .string({ message: "Font family is required" })
    .min(1, "Font family cannot be empty"),
  borderRadius: z.union([
    z.string(),
    z.nativeEnum($Enums.BorderRadius)
  ]).transform(val => String(val)),
});

export const PageDataSchema = z.object({
  id: z.number({ message: "Page ID must be a number" }).int().positive(),
  name: z
    .string({ message: "Page name is required" })
    .min(1, "Page name cannot be empty"),
  order: z
    .number({ message: "Page order must be a number" })
    .int()
    .min(1, "Page order must be at least 1"),
  linkingId: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  seoKeywords: z.string().nullable(),
  createdAt: z.coerce.date({ message: "Created date is invalid" }),
  updatedAt: z.coerce.date({ message: "Updated date is invalid" }),
});

export const FunnelWithPagesAndThemeSchema = z.object({
  id: z.number({ message: "Funnel ID must be a number" }).int().positive(),
  name: z
    .string({ message: "Funnel name is required" })
    .min(1, "Funnel name cannot be empty"),
  status: z.nativeEnum($Enums.FunnelStatus, {
    message: "Invalid funnel status",
  }),
  userId: z.number({ message: "User ID must be a number" }).int().positive(),
  createdAt: z.coerce.date({ message: "Created date is invalid" }),
  updatedAt: z.coerce.date({ message: "Updated date is invalid" }),
  pages: z.array(PageDataSchema, { message: "Pages must be an array" }),
  theme: ThemeDataSchema.nullable(),
});

export const GetFunnelByIdResponseSchema = z.object({
  data: FunnelWithPagesAndThemeSchema,
});

// TypeScript types inferred from Zod schemas
export type GetFunnelByIdParams = z.infer<typeof GetFunnelByIdParamsSchema>;
export type ThemeData = z.infer<typeof ThemeDataSchema>;
export type PageData = z.infer<typeof PageDataSchema>;
export type FunnelWithPagesAndTheme = z.infer<
  typeof FunnelWithPagesAndThemeSchema
>;
export type GetFunnelByIdResponse = z.infer<typeof GetFunnelByIdResponseSchema>;
