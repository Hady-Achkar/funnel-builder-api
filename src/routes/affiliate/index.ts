import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { AffiliateLinkController } from "../../controllers/affiliate/generate-affiliate-link";
import { AffiliateLinkClickController } from "../../controllers/affiliate/affiliate-click";

const router: Router = express.Router();

// Affiliate link management routes
router.post("/generate-link", authenticateToken, AffiliateLinkController.generateLink);

// Public affiliate click tracking route (no auth required, rejects authenticated users)
router.post("/click", AffiliateLinkClickController.trackClick);

export default router;