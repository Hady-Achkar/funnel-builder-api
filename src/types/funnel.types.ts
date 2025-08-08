// Import Prisma enum type
import { $Enums } from "../generated/prisma-client";
import { PageSummary } from "./page.types";

export interface CreateFunnelResponse {
  id: number;
  message: string;
}

export interface CreateFunnelData {
  name: string;
  status?: $Enums.FunnelStatus;
}

export interface UpdateFunnelData {
  name?: string;
  status?: $Enums.FunnelStatus;
  domainId?: number | null; // Add domain connection support
}

export interface DeleteFunnelResponse {
  id: number;
  name: string;
  message: string;
}

export interface FunnelListItem {
  id: number;
  name: string;
  status: $Enums.FunnelStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Theme data structure used in cache
export interface ThemeData {
  id: number;
  name: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderColor: string;
  optionColor: string;
  fontFamily: string;
  borderRadius: string;
}

// Page data structure used in cache
export interface PageData {
  id: number;
  name: string;
  order: number;
  linkingId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CachedFunnelData {
  id: number;
  name: string;
  status: $Enums.FunnelStatus;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  theme: ThemeData | null;
}

export interface CachedFunnelDataWithPages {
  id: number;
  name: string;
  status: $Enums.FunnelStatus;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  theme: ThemeData | null;
  pages: PageSummary[];
}

export interface FunnelListResponse {
  funnels: FunnelListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FunnelListQuery {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: "name" | "status" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface CachedFunnelWithPages {
  id: number;
  name: string;
  status: $Enums.FunnelStatus;
  userId: number;
  themeId: number | null;
  createdAt: Date;
  updatedAt: Date;
  pages: PageSummary[]; // Page summaries without content
  theme: ThemeData | null;
}

export interface FunnelWithPagesAndTheme {
  id: number;
  name: string;
  status: string;
  userId: number;
  themeId: number | null;
  createdAt: Date;
  updatedAt: Date;
  pages: PageData[];
  theme: ThemeData | null;
}
