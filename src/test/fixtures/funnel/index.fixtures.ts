import {
  CreateFunnelRequest,
  WorkspacePayload,
  WorkspaceMemberPayload,
} from "../../../types/funnel/create";
import { $Enums } from "../../../generated/prisma-client";

// Test fixtures for funnel creation - ONLY for test files

// Workspace fixtures (used in funnel creation tests)
export const mockWorkspace: WorkspacePayload = {
  id: 8,
  name: "Test Workspace",
  ownerId: 1,
  allocatedFunnels: 10,
  owner: {
    id: 1,
    maximumFunnels: 50,
  },
};

export const mockWorkspaceMember: WorkspaceMemberPayload = {
  role: $Enums.WorkspaceRole.ADMIN,
  permissions: ["CREATE_FUNNEL"],
};

// Funnel request fixtures
export const mockCreateFunnelRequest: CreateFunnelRequest = {
  name: "Test Funnel",
  workspaceSlug: "test-workspace",
  status: $Enums.FunnelStatus.DRAFT,
};

// Database entity fixtures
export const mockFunnel = {
  id: 123,
  name: "Test Funnel",
  slug: "test-funnel",
  status: $Enums.FunnelStatus.DRAFT,
  workspaceId: 8,
  createdBy: 1,
  createdAt: new Date("2023-01-01T00:00:00.000Z"),
  updatedAt: new Date("2023-01-01T00:00:00.000Z"),
};

export const mockTheme = {
  id: 456,
  createdAt: new Date("2023-01-01T00:00:00.000Z"),
  updatedAt: new Date("2023-01-01T00:00:00.000Z"),
};

export const mockHomePage = {
  id: 789,
  name: "Home",
  content: "Default home page content",
  order: 1,
  funnelId: 123,
  linkingId: "home",
  seoTitle: null,
  seoDescription: null,
  seoKeywords: null,
  createdAt: new Date("2023-01-01T00:00:00.000Z"),
  updatedAt: new Date("2023-01-01T00:00:00.000Z"),
};

// Service response fixture
export const mockCreateFunnelResponse = {
  response: {
    message: "Funnel created successfully!",
    funnelId: 123,
  },
  workspaceId: 8,
};

// Payload fixtures for testing factory logic
export const mockCreateFunnelPayload = {
  name: "Test Funnel",
  slug: "test-funnel", 
  status: $Enums.FunnelStatus.DRAFT,
  workspaceId: 8,
  createdBy: 1
};

export const mockCreateFunnelSettingsPayload = {
  funnelId: 123,
  defaultSeoTitle: null,
  defaultSeoDescription: null,
  defaultSeoKeywords: null,
  favicon: null,
  ogImage: null,
  googleAnalyticsId: null,
  facebookPixelId: null,
  cookieConsentText: null,
  privacyPolicyUrl: null,
  termsOfServiceUrl: null,
};

export const mockCreateHomePagePayload = {
  name: "Home",
  content: "",
  order: 1,
  funnelId: 123,
  linkingId: "home",
};

export const mockUpdateFunnelWithThemePayload = {
  themeId: 456,
};