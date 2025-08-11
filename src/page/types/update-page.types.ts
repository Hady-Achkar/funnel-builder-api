import { PageData } from "./shared.types";

export interface UpdatePageData {
  name?: string;
  content?: string;
  order?: number;
  linkingId?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface UpdatePageResponse {
  success: boolean;
  data: PageData;
  message: string;
}