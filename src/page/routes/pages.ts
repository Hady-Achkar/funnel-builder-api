import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { 
  createPage, 
  getPageById, 
  getPublicPage, 
  updatePage, 
  deletePage, 
  reorderPages, 
  duplicatePage,
  createPageVisit
} from "../controllers";

const router: Router = express.Router();

// Routes for pages within funnels (protected)
router.post("/funnels/:funnelId/pages", authenticateToken, createPage);
router.put("/funnels/:funnelId/pages/reorder", authenticateToken, reorderPages);

// Routes for individual pages (protected)
router.get("/:id", authenticateToken, getPageById);
router.put("/:id", authenticateToken, updatePage);
router.delete("/:id", authenticateToken, deletePage);
router.post("/:pageId/duplicate", authenticateToken, duplicatePage);

// Public routes
router.get("/funnel/:funnelId/link/:linkingId", getPublicPage);
router.post("/:pageId/visit", createPageVisit);

export default router;
