import { createPage } from "./create";
import { getPageById } from "./getPageById";
import { getPublicPage } from "./getPublicPage";
import { updatePage } from "./update";
import { deletePage } from "./delete";
import { reorderPages } from "./reorder";
import { duplicatePage } from "./duplicate";
import { createPageVisit } from "./createPageVisit";
import { setPrismaClient } from "../../lib/prisma";

export class PageService {
  static createPage = createPage;
  static getPageById = getPageById;
  static getPublicPage = getPublicPage;
  static updatePage = updatePage;
  static deletePage = deletePage;
  static reorderPages = reorderPages;
  static duplicatePage = duplicatePage;
  static createPageVisit = createPageVisit;
}

// Export for test environments
export { setPrismaClient };