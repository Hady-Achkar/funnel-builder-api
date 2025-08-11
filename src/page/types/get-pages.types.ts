import { PageData, PublicPageData } from "./shared.types";

export interface GetPageByIdResponse {
  success: boolean;
  data: PageData;
  message: string;
}

export interface GetPageByLinkingIdResponse {
  success: boolean;
  data: PublicPageData;
}