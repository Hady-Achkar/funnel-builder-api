import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { updatePageController } from "../update";
import { createPageController } from "../create";
import { getPageController } from "../get";
import { getPublicPageController } from "../getPublicPage";
import { createPageVisitController } from "../createPageVisit";
import { deletePageController } from "../delete";
import { duplicatePageController } from "../duplicate";
import { reorderPagesController } from "../reorder";

const router: Router = express.Router();

// Routes for pages within funnels (protected)
router.post("/funnels/:funnelId/pages", authenticateToken, createPageController);
router.put("/funnels/:funnelId/pages/reorder", authenticateToken, reorderPagesController);

// Routes for individual pages (protected)
router.get("/:id", authenticateToken, getPageController);
router.put("/:id", authenticateToken, updatePageController);
router.delete("/:id", authenticateToken, deletePageController);
router.post("/:pageId/duplicate", authenticateToken, duplicatePageController);

// Public routes
router.get("/funnel/:funnelSlug([a-z0-9-]+)/page/:linkingId", getPublicPageController);
router.post("/:pageId/visit", createPageVisitController);

export default router;
