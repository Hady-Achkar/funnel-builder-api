import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { checkFunnelAccess } from "../../middleware/funnelAccess";
import { updatePageController } from "../../controllers/page/update";
import { createPageController } from "../../controllers/page/create";
import { getPageController } from "../../controllers/page/get";
import { getPublicPageController } from "../../controllers/page/getPublicPage";
import { createPageVisitController } from "../../controllers/page/createPageVisit";
import { deletePageController } from "../../controllers/page/delete";
import { duplicatePageController } from "../../controllers/page/duplicate";
import { reorderPagesController } from "../../controllers/page/reorder";

const router: Router = express.Router();

// Routes for pages within funnels (protected)
router.post("/funnels/:funnelId", authenticateToken, createPageController);
router.put(
  "/funnels/:funnelId/pages/reorder",
  authenticateToken,
  reorderPagesController
);

// Routes for individual pages (protected)
router.get("/:id", authenticateToken, getPageController);
router.put("/:id", authenticateToken, updatePageController);
router.delete("/:id", authenticateToken, deletePageController);
router.post("/:pageId/duplicate", authenticateToken, duplicatePageController);

// Public routes
router.get(
  "/funnel/:funnelSlug([a-z0-9-]+)/page/:linkingId",
  checkFunnelAccess,
  getPublicPageController
);
router.post("/:pageId/visit", createPageVisitController);

export default router;