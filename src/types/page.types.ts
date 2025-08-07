export interface CreatePageRequest {
  name?: string;
  content?: string;
  order?: number;
  linkingId?: string;
}

export interface CreatePageResponse {
  id: number;
  name: string;
  linkingId: string;
  order: number;
  message: string;
}

export interface UpdatePageData {
  name?: string;
  content?: string;
  order?: number;
  linkingId?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface PageData {
  id: number;
  name: string;
  content: string | null;
  order: number;
  linkingId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  funnelId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageSummary {
  id: number;
  name: string;
  order: number;
  linkingId: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetFunnelPagesResponse {
  success: boolean;
  data: PageSummary[];
  message: string;
}

export interface GetPageByIdResponse {
  success: boolean;
  data: PageData;
  message: string;
}

export interface PublicPageData {
  id: number;
  name: string;
  content: string | null;
  linkingId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  funnelName: string;
  funnelId: number;
}

export interface GetPageByLinkingIdResponse {
  success: boolean;
  data: PublicPageData;
}

export interface UpdatePageResponse {
  success: boolean;
  data: PageData;
  message: string;
}

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

export interface CreatePageVisitResponse {
  success: boolean;
  message: string;
}

export interface PageVisitSummary {
  id: number;
  name: string;
  linkingId: string | null;
  visits: number;
}

export interface GetFunnelPageVisitsResponse {
  success: boolean;
  data: PageVisitSummary[];
  message: string;
}
