export interface DuplicatePageRequest {
  targetFunnelId?: number; // If not provided, duplicates to same funnel
  newName?: string; // If not provided, auto-generates name
  newLinkingId?: string; // If not provided, auto-generates linkingId
}

export interface DuplicatePageResponse {
  id: number;
  name: string;
  linkingId: string;
  order: number;
  funnelId: number;
  message: string;
}