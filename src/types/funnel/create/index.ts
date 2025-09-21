import { z } from "zod";
import { format } from "date-fns";
import { $Enums } from "../../../generated/prisma-client";

export const createFunnelRequest = z.object({
  name: z
    .string({ message: "Funnel name must be a string" })
    .trim()
    .min(1, "Funnel name cannot be empty")
    .max(100, "Funnel name must be less than 100 characters")
    .optional()
    .default(() => format(new Date(), "dd.MM.yyyy HH:mm")),
  slug: z
    .string({ message: "Funnel slug must be a string" })
    .trim()
    .min(1, "Funnel slug cannot be empty")
    .max(100, "Funnel slug must be less than 100 characters")
    .optional(),
  status: z
    .enum($Enums.FunnelStatus, {
      message: "Status must be DRAFT, LIVE, ARCHIVED, or SHARED",
    })
    .optional()
    .default($Enums.FunnelStatus.DRAFT),
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
});

export const createFunnelResponse = z.object({
  message: z.string(),
  funnelId: z.number(),
});

export const workspacePayload = z.object(
  {
    id: z.number({ message: "Workspace ID must be a valid number" }),
    name: z.string({ message: "Workspace name must be a string" }),
    ownerId: z.number({ message: "Owner ID must be a valid number" }),
  },
  { message: "Workspace data is required" }
);

export const workspaceMemberPayload = z.object({
  role: z.enum($Enums.WorkspaceRole, "Member role must be valid"),
  permissions: z.array(z.enum($Enums.WorkspacePermission)),
});

export const createFunnelPayload = z.object(
  {
    name: z
      .string({ message: "Funnel name must be a string" })
      .min(1, "Funnel name cannot be empty")
      .max(100, "Funnel name must be less than 100 characters"),
    slug: z
      .string({ message: "Funnel slug must be a string" })
      .min(1, "Funnel slug cannot be empty")
      .max(100, "Funnel slug must be less than 100 characters"),
    status: z.enum(
      $Enums.FunnelStatus,
      "Status must be DRAFT, LIVE, ARCHIVED, or SHARED"
    ),
    workspaceId: z.number({ message: "Workspace ID must be a valid number" }),
    createdBy: z.number({ message: "Creator ID must be a valid number" }),
  },
  { message: "Funnel creation data is required" }
);

export const createFunnelSettingsPayload = z.object(
  {
    funnelId: z.number({ message: "Funnel ID must be a valid number" }),
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
  { message: "Funnel settings data is required" }
);

export const updateFunnelWithThemePayload = z.object(
  {
    themeId: z.number({ message: "Theme ID must be a valid number" }),
  },
  { message: "Theme update data is required" }
);

export const createHomePagePayload = z.object(
  {
    name: z
      .string({ message: "Page name must be a string" })
      .min(1, "Page name cannot be empty")
      .max(100, "Page name must be less than 100 characters"),
    content: z.string({ message: "Page content must be a string" }),
    order: z
      .number({ message: "Page order must be a valid number" })
      .min(1, "Page order must be at least 1"),
    funnelId: z.number({ message: "Funnel ID must be a valid number" }),
    linkingId: z
      .string({ message: "Linking ID must be a string" })
      .min(1, "Linking ID cannot be empty"),
    type: z.enum($Enums.PageType),
  },
  { message: "Home page creation data is required" }
);

export type CreateFunnelRequest = z.infer<typeof createFunnelRequest>;
export type CreateFunnelResponse = z.infer<typeof createFunnelResponse>;
export type WorkspacePayload = z.infer<typeof workspacePayload>;
export type WorkspaceMemberPayload = z.infer<typeof workspaceMemberPayload>;
export type CreateFunnelPayload = z.infer<typeof createFunnelPayload>;
export type CreateFunnelSettingsPayload = z.infer<
  typeof createFunnelSettingsPayload
>;
export type UpdateFunnelWithThemePayload = z.infer<
  typeof updateFunnelWithThemePayload
>;
export type CreateHomePagePayload = z.infer<typeof createHomePagePayload>;
