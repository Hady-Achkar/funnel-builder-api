import { z } from "zod";
import { WorkspaceRole, WorkspacePermission, DomainType, DomainStatus, SslStatus } from "../../../generated/prisma-client";

// Request parameters
export const getWorkspaceParams = z.object({
  slug: z.string().min(3, "Workspace slug must be at least 3 characters"),
});

export type GetWorkspaceParams = z.infer<typeof getWorkspaceParams>;

// Workspace member schema
export const workspaceMemberSchema = z.object({
  id: z.number(),
  userId: z.number(),
  role: z.nativeEnum(WorkspaceRole),
  permissions: z.array(z.nativeEnum(WorkspacePermission)),
  joinedAt: z.date(),
  updatedAt: z.date(),
  user: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    username: z.string(),
  }),
});

export type WorkspaceMember = z.infer<typeof workspaceMemberSchema>;

// Workspace domain schema
export const workspaceDomainSchema = z.object({
  id: z.number(),
  hostname: z.string(),
  type: z.nativeEnum(DomainType),
  status: z.nativeEnum(DomainStatus),
  sslStatus: z.nativeEnum(SslStatus),
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
  }),
  
  // Current user's role and permissions in this workspace
  currentUserMember: z.object({
    role: z.nativeEnum(WorkspaceRole),
    permissions: z.array(z.nativeEnum(WorkspacePermission)),
    joinedAt: z.date(),
  }),
  
  // All members
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
  }),
});

export type GetWorkspaceResponse = z.infer<typeof getWorkspaceResponse>;