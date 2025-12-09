import { z } from "zod";
import { TemplateImageType } from "../../../generated/prisma-client";

// Slug validation: only letters, numbers, spaces, and hyphens allowed
const slugRegex = /^[a-zA-Z0-9\s-]+$/;

export const templateImageSchema = z.object({
  imageUrl: z
    .string({
      message: "Image URL must be a string",
    })
    .url("Image URL must be a valid URL"),
  imageType: z.nativeEnum(TemplateImageType, {
    message: "Image type must be either THUMBNAIL or PREVIEW",
  }),
  order: z
    .number({
      message: "Order must be a number",
    })
    .int("Order must be an integer")
    .min(0, "Order must be a non-negative integer"),
  caption: z
    .string({
      message: "Caption must be a string",
    })
    .max(255, "Caption must be less than 255 characters")
    .optional(),
});

export const createTemplateFromFunnelRequestSchema = z.object({
  name: z
    .string({
      message: "Template name is required",
    })
    .trim()
    .min(1, "Template name cannot be empty")
    .max(255, "Template name must be less than 255 characters"),
  slug: z
    .string({
      message: "Slug is required",
    })
    .trim()
    .min(1, "Slug cannot be empty")
    .max(255, "Slug must be less than 255 characters")
    .refine((val) => slugRegex.test(val), {
      message: "Slug can only contain letters, numbers, spaces, and hyphens",
    }),
  description: z
    .string({
      message: "Description is required",
    })
    .trim()
    .min(1, "Description cannot be empty")
    .max(1000, "Description must be less than 1000 characters"),
  categoryId: z.coerce
    .number({
      message: "Category ID is required",
    })
    .int("Category ID must be an integer")
    .positive("Category ID must be a positive number"),
  workspaceSlug: z
    .string({
      message: "Workspace slug is required",
    })
    .trim()
    .min(1, "Workspace slug cannot be empty"),
  funnelSlug: z
    .string({
      message: "Funnel slug is required",
    })
    .trim()
    .min(1, "Funnel slug cannot be empty"),
  tags: z
    .array(z.string().trim().min(1, "Tag cannot be empty"))
    .max(10, "Cannot have more than 10 tags")
    .optional()
    .nullable(),
  images: z
    .array(templateImageSchema)
    .refine(
      (images) => {
        const thumbnailCount = images.filter(
          (img) => img.imageType === TemplateImageType.THUMBNAIL
        ).length;
        return thumbnailCount === 1;
      },
      {
        message: "Exactly one thumbnail image is required",
      }
    ),
});

export type CreateTemplateFromFunnelRequest = z.infer<
  typeof createTemplateFromFunnelRequestSchema
>;

export type TemplateImageInput = z.infer<typeof templateImageSchema>;

export const createTemplateFromFunnelResponseSchema = z.object({
  message: z.string(),
  templateId: z.number(),
  slug: z.string(),
});

export type CreateTemplateFromFunnelResponse = z.infer<
  typeof createTemplateFromFunnelResponseSchema
>;
