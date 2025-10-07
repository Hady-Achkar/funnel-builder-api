import { z } from "zod";
import { format } from "date-fns";
import { $Enums } from "../../../generated/prisma-client";

export const createFunnelRequest = z.object({
  name: z
    .string({ message: "Please enter a funnel name" })
    .trim()
    .min(1, "Your funnel needs a name")
    .max(100, "Funnel name is too long. Please keep it under 100 characters")
    .optional()
    .default(() => format(new Date(), "dd.MM.yyyy HH:mm:ss")),
  slug: z
    .string({ message: "Please provide a valid slug" })
    .trim()
    .min(1, "Slug cannot be empty")
    .max(100, "Slug is too long. Please keep it under 100 characters")
    .optional(),
  status: z
    .enum($Enums.FunnelStatus, {
      message: "Please choose a valid status (Draft, Live, Archived, or Shared)",
    })
    .optional()
    .default($Enums.FunnelStatus.DRAFT),
  workspaceSlug: z.string().min(1, "Please select a workspace"),
});

export const createFunnelResponse = z.object({
  message: z.string(),
  funnelId: z.number(),
});

export const workspaceMemberPayload = z.object({
  role: z.enum($Enums.WorkspaceRole, "Invalid member role"),
  permissions: z.array(z.enum($Enums.WorkspacePermission)),
});

export const createFunnelPayload = z.object(
  {
    name: z
      .string({ message: "Please enter a funnel name" })
      .min(1, "Your funnel needs a name")
      .max(100, "Funnel name is too long. Please keep it under 100 characters"),
    slug: z
      .string({ message: "Please provide a valid slug" })
      .min(1, "Slug cannot be empty")
      .max(100, "Slug is too long. Please keep it under 100 characters"),
    status: z.enum(
      $Enums.FunnelStatus,
      "Please choose a valid status (Draft, Live, Archived, or Shared)"
    ),
    workspaceId: z.number({ message: "Invalid workspace" }),
    createdBy: z.number({ message: "User information is missing" }),
  },
  { message: "Funnel information is required" }
);

export const createFunnelSettingsPayload = z.object(
  {
    funnelId: z.number({ message: "Invalid funnel" }),
    defaultSeoTitle: z.string().nullable().optional(),
    defaultSeoDescription: z.string().nullable().optional(),
    defaultSeoKeywords: z.string().nullable().optional(),
    favicon: z.string().nullable().optional(),
    ogImage: z.string().nullable().optional(),
    googleAnalyticsId: z.string().nullable().optional(),
    facebookPixelId: z.string().nullable().optional(),
    cookieConsentText: z.string().nullable().optional(),
    privacyPolicyUrl: z.string().nullable().optional(),
    termsOfServiceUrl: z.string().nullable().optional(),
  },
  { message: "Funnel settings information is required" }
);

export const updateFunnelWithThemePayload = z.object(
  {
    activeThemeId: z.number({ message: "Invalid theme" }),
  },
  { message: "Theme information is required" }
);

export const createHomePagePayload = z.object(
  {
    name: z
      .string({ message: "Please enter a page name" })
      .min(1, "Your page needs a name")
      .max(100, "Page name is too long. Please keep it under 100 characters"),
    content: z.string({ message: "Page content is required" }),
    order: z
      .number({ message: "Please provide a valid page order" })
      .min(1, "Page order must be at least 1"),
    funnelId: z.number({ message: "Invalid funnel" }),
    linkingId: z
      .string({ message: "Please provide a valid page link" })
      .min(1, "Page link cannot be empty"),
    type: z.enum($Enums.PageType),
  },
  { message: "Page information is required" }
);

export type CreateFunnelRequest = z.infer<typeof createFunnelRequest>;
export type CreateFunnelResponse = z.infer<typeof createFunnelResponse>;
export type WorkspaceMemberPayload = z.infer<typeof workspaceMemberPayload>;
export type CreateFunnelPayload = z.infer<typeof createFunnelPayload>;
export type CreateFunnelSettingsPayload = z.infer<
  typeof createFunnelSettingsPayload
>;
export type UpdateFunnelWithThemePayload = z.infer<
  typeof updateFunnelWithThemePayload
>;
export type CreateHomePagePayload = z.infer<typeof createHomePagePayload>;
