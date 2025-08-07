import { createPage } from "./create";
import { getFunnelPages, getPageById, getPageByLinkingId } from "./get";
import { updatePage } from "./update";
import { deletePage } from "./delete";
import { reorderPages } from "./reorder";
import { duplicatePage } from "./duplicate";
import { createPageVisit } from "./createPageVisit";
import { getFunnelPageVisits } from "./getFunnelPageVisits";
import { setPrismaClient } from "../../lib/prisma";

export class PageService {
  static createPage = createPage;
  static getFunnelPages = getFunnelPages;
  static getPageById = getPageById;
  static getPageByLinkingId = getPageByLinkingId;
  static updatePage = updatePage;
  static deletePage = deletePage;
  static reorderPages = reorderPages;
  static duplicatePage = duplicatePage;
  static createPageVisit = createPageVisit;
  static getFunnelPageVisits = getFunnelPageVisits;
}

// Export for test environments
export { setPrismaClient };