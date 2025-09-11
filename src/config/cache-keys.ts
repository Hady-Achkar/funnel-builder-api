import { Workspace } from "../generated/prisma-client";

export const CACHE_KEYS = {
  WORKSPACE: {
    FUNNELS: {
      /**
       * Cache key for all funnels in a workspace
       * TTL: Forever (no expiration)
       * Used for: Listing all funnels in a workspace
       * Invalidated on: Funnel create, update, delete, duplicate
       */
      ALL: (workspaceId: Pick<Workspace, "id">["id"]) =>
        `workspace:${workspaceId}:funnels:all` as const,
    },
  },
} as const;

export type CacheKeys = typeof CACHE_KEYS;
