import express from "express";
import { getPublicPageController } from "../controller";

const router = express.Router();

// Public route for accessing pages by funnel slug
// Regex allows lowercase letters, numbers, and hyphens (typical slug format)
router.get("/funnel/:funnelSlug([a-z0-9-]+)/page/:linkingId", getPublicPageController);

export default router;