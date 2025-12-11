import { z } from "zod";
import { TemplateImageType } from "../../../generated/prisma-client";

const slugRegex = /^[a-zA-Z0-9\s-]+$/;

export const templateImageInputSchema = z.object({
  imageUrl: z
    .string({ message: "Image URL must be a string" })
    .url("Image URL must be a valid URL"),
  imageType: z.nativeEnum(TemplateImageType, {
    message: "Image type must be either THUMBNAIL or PREVIEW",
  }),
  order: z
    .number({ message: "Order must be a number" })
    .int("Order must be an integer")
    .min(0, "Order must be a non-negative integer"),
  caption: z
    .string({ message: "Caption must be a string" })
    .max(255, "Caption must be less than 255 characters")
    .nullable()
    .optional(),
});

export type TemplateImageInput = z.infer<typeof templateImageInputSchema>;

export const updateTemplateBody = z
  .object({
    name: z
      .string({ message: "Name must be a string" })
      .trim()
      .min(1, { message: "Name cannot be empty" })
      .max(255, { message: "Name must be less than 255 characters" })
      .optional(),
    slug: z
      .string({ message: "Slug must be a string" })
      .trim()
      .min(1, { message: "Slug cannot be empty" })
      .max(255, { message: "Slug must be less than 255 characters" })
      .refine((val) => slugRegex.test(val), {
        message: "Slug can only contain letters, numbers, spaces, and hyphens",
      })
      .optional(),
    description: z
      .string({ message: "Description must be a string" })
      .nullable()
      .optional(),
    categoryId: z
      .number({ message: "Category ID must be a number" })
      .int({ message: "Category ID must be an integer" })
      .positive({ message: "Category ID must be a positive number" })
      .optional(),
    tags: z
      .array(z.string({ message: "Each tag must be a string" }), {
        message: "Tags must be an array of strings",
      })
      .optional(),
    isActive: z.boolean({ message: "isActive must be a boolean" }).optional(),
    isPublic: z.boolean({ message: "isPublic must be a boolean" }).optional(),
    images: z
      .array(templateImageInputSchema, {
        message: "Images must be an array of image objects",
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.images || data.images.length === 0) return true;
      const thumbnailCount = data.images.filter(
        (img) => img.imageType === TemplateImageType.THUMBNAIL
      ).length;
      return thumbnailCount === 1;
    },
    {
      message: "Exactly one thumbnail image is required when providing images",
      path: ["images"],
    }
  );

export type UpdateTemplateBody = z.infer<typeof updateTemplateBody>;

export const updateTemplateParams = z.object({
  templateSlug: z
    .string({ message: "Template slug is required" })
    .trim()
    .min(1, { message: "Template slug cannot be empty" }),
});

export type UpdateTemplateParams = z.infer<typeof updateTemplateParams>;

export interface UpdateTemplateRequest {
  templateSlug: string;
  userId: number;
  isAdmin: boolean;
  body: UpdateTemplateBody;
}

export const updateTemplateResponse = z.object({
  message: z.string(),
});

export type UpdateTemplateResponse = z.infer<typeof updateTemplateResponse>;
