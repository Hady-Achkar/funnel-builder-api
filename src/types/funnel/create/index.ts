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
    .nativeEnum($Enums.FunnelStatus, {
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
    allocatedFunnels: z.number({
      message: "Allocated funnels must be a valid number",
    }),
    owner: z.object(
      {
        id: z.number({ message: "Owner ID must be a valid number" }),
        maximumFunnels: z.number({
          message: "Maximum funnels must be a valid number",
        }),
      },
      { message: "Workspace owner information is required" }
    ),
  },
  { message: "Workspace data is required" }
);

export const workspaceMemberPayload = z.object({
  role: z.nativeEnum($Enums.WorkspaceRole, "Member role must be valid"),
  permissions: z.array(z.nativeEnum($Enums.WorkspacePermission)),
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
    status: z.nativeEnum(
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
    defaultSeoTitle: z.null().optional(),
    defaultSeoDescription: z.null().optional(),
    defaultSeoKeywords: z.null().optional(),
    favicon: z.null().optional(),
    ogImage: z.null().optional(),
    googleAnalyticsId: z.null().optional(),
    facebookPixelId: z.null().optional(),
    cookieConsentText: z.null().optional(),
    privacyPolicyUrl: z.null().optional(),
    termsOfServiceUrl: z.null().optional(),
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
