import express, { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { 
  createPage, 
  getFunnelPages, 
  getPageById, 
  getPageByLinkingId, 
  updatePage, 
  deletePage, 
  reorderPages, 
  duplicatePage,
  createPageVisit,
  getFunnelPageVisits 
} from "../controllers/page";

const router: Router = express.Router();

// Routes for pages within funnels (protected)
router.post("/funnels/:funnelId/pages", authenticateToken, createPage);
router.get("/funnels/:funnelId/pages", authenticateToken, getFunnelPages);
router.get("/funnels/:funnelId/visits", authenticateToken, getFunnelPageVisits);
router.put("/funnels/:funnelId/pages/reorder", authenticateToken, reorderPages);

// Routes for individual pages (protected)
router.get("/:id", authenticateToken, getPageById);
router.put("/:id", authenticateToken, updatePage);
router.delete("/:id", authenticateToken, deletePage);
router.post("/:pageId/duplicate", authenticateToken, duplicatePage);

// Public routes
router.get("/funnel/:funnelId/link/:linkingId", getPageByLinkingId);
router.post("/:pageId/visit", createPageVisit);

export default router;
