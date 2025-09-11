import { $Enums, Page } from "../../../generated/prisma-client";

export type CreatePagePayload = {
  name: Pick<Page, "name">["name"];
  content: Pick<Page, "content">["content"] | null;
  order: Pick<Page, "order">["order"];
  linkingId: Pick<Page, "linkingId">["linkingId"];
  seoTitle: Pick<Page, "seoTitle">["seoTitle"] | null;
  seoDescription: Pick<Page, "seoDescription">["seoDescription"] | null;
  seoKeywords: Pick<Page, "seoKeywords">["seoKeywords"] | null;
  funnelId: Pick<Page, "funnelId">["funnelId"];
  type: $Enums.PageType;
};
