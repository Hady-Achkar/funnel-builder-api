import { z } from "zod";
import { WorkspaceRole, WorkspacePermission } from "../../../generated/prisma-client";

// Request schema for creating a workspace
export const createWorkspaceRequest = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(50, "Workspace name must be 50 characters or less")
    .trim(),
  
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(30, "Slug must be 30 characters or less")
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Slug must contain only lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen")
    .transform((val) => val.toLowerCase()),
  
  description: z
    .string()
    .max(200, "Description must be 200 characters or less")
    .optional(),
  
  allocations: z.object({
    allocatedFunnels: z
      .number()
      .int()
      .min(0, "Allocated funnels must be 0 or more")
      .max(1000, "Allocated funnels cannot exceed 1000"),
    
    allocatedCustomDomains: z
      .number()
      .int()
      .min(0, "Allocated custom domains must be 0 or more")
      .max(100, "Allocated custom domains cannot exceed 100"),
    
    allocatedSubdomains: z
      .number()
      .int()
      .min(0, "Allocated subdomains must be 0 or more")
      .max(100, "Allocated subdomains cannot exceed 100"),
  }).optional(),
});

export type CreateWorkspaceRequest = z.infer<typeof createWorkspaceRequest>;

// Response schemas
export const workspaceDetailsSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  ownerId: z.number(),
  allocatedFunnels: z.number(),
  allocatedCustomDomains: z.number(),
  allocatedSubdomains: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WorkspaceDetails = z.infer<typeof workspaceDetailsSchema>;

export const subdomainDetailsSchema = z.object({
  id: z.number(),
  hostname: z.string(),
  type: z.string(),
  status: z.string(),
  sslStatus: z.string(),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  cloudflareRecordId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubdomainDetails = z.infer<typeof subdomainDetailsSchema>;

export const workspaceMemberDetailsSchema = z.object({
  id: z.number(),
  userId: z.number(),
  workspaceId: z.number(),
  role: z.nativeEnum(WorkspaceRole),
  permissions: z.array(z.nativeEnum(WorkspacePermission)),
  joinedAt: z.date(),
  updatedAt: z.date(),
});

export type WorkspaceMemberDetails = z.infer<typeof workspaceMemberDetailsSchema>;

export const createWorkspaceResponse = z.object({
  message: z.string(),
  workspaceId: z.number(),
});

export type CreateWorkspaceResponse = z.infer<typeof createWorkspaceResponse>;

// Internal types for service logic
export const workspaceAllocationValidation = z.object({
  userId: z.number(),
  requestedFunnels: z.number(),
  requestedCustomDomains: z.number(),
  requestedSubdomains: z.number(),
});

export type WorkspaceAllocationValidation = z.infer<typeof workspaceAllocationValidation>;