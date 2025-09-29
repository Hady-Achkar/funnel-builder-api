import { z } from "zod";
import {
  WorkspaceRole,
  WorkspacePermission,
  DomainType,
  DomainStatus,
  SslStatus,
  UserPlan,
  MembershipStatus,
} from "../../../generated/prisma-client";

// Request parameters
export const getWorkspaceParams = z.object({
  slug: z.string().min(3, "Workspace slug must be at least 3 characters"),
});

export type GetWorkspaceParams = z.infer<typeof getWorkspaceParams>;

// Workspace member schema
export const workspaceMemberSchema = z.object({
  id: z.number(),
  userId: z.number().nullable(),
  email: z.string().nullable(), 
  role: z.enum(WorkspaceRole),
  permissions: z.array(z.enum(WorkspacePermission)),
  status: z.enum(MembershipStatus),
  joinedAt: z.date(),
  updatedAt: z.date(),
  user: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    username: z.string(),
  }).nullable(),
});

export type WorkspaceMember = z.infer<typeof workspaceMemberSchema>;

// Workspace domain schema
export const workspaceDomainSchema = z.object({
  id: z.number(),
  hostname: z.string(),
  type: z.enum(DomainType),
  status: z.enum(DomainStatus),
  sslStatus: z.enum(SslStatus),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WorkspaceDomain = z.infer<typeof workspaceDomainSchema>;

// Funnel summary schema (lightweight version)
export const funnelSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  pagesCount: z.number(),
});

export type FunnelSummary = z.infer<typeof funnelSummarySchema>;

// Full workspace details response
export const getWorkspaceResponse = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  image: z.string().nullable().optional(),
  settings: z.any().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),

  // Owner information
  owner: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    username: z.string(),
    plan: z.enum(UserPlan),
    maximumWorkspaces: z.number(),
  }),

  // Current user's role and permissions in this workspace
  currentUserMember: z.object({
    role: z.enum(WorkspaceRole),
    permissions: z.array(z.enum(WorkspacePermission)),
    joinedAt: z.date(),
  }),

  members: z.array(workspaceMemberSchema),

  // Domains
  domains: z.array(workspaceDomainSchema),

  // Funnels (summary)
  funnels: z.array(funnelSummarySchema),

  // Usage statistics
  usage: z.object({
    funnelsUsed: z.number(),
    customDomainsUsed: z.number(),
    subdomainsUsed: z.number(),
    totalDomains: z.number(),
    membersCount: z.number(),
    activeFunnels: z.number(),
    draftFunnels: z.number(),
    archivedFunnels: z.number(),
  }),

  // Workspace limits
  limits: z.object({
    maxFunnels: z.number(),
    maxDomains: z.number(),
    maxMembers: z.number(),
    maxStorage: z.number(), // in MB
    funnelsRemaining: z.number(),
    domainsRemaining: z.number(),
  }),

  // Role-based permissions (raw permission constants)
  rolePermissions: z.object({
    OWNER: z.array(z.enum(WorkspacePermission)),
    ADMIN: z.array(z.enum(WorkspacePermission)),
    EDITOR: z.array(z.enum(WorkspacePermission)),
    VIEWER: z.array(z.enum(WorkspacePermission)),
  }),
});

export type GetWorkspaceResponse = z.infer<typeof getWorkspaceResponse>;
