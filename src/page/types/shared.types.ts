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