import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { AffiliateLinkController } from "../../controllers/affiliate/generate-affiliate-link";
import { AffiliateLinkClickController } from "../../controllers/affiliate/affiliate-click";
import { GetAllAffiliateLinksController } from "../../controllers/affiliate/get-all-affiliate-links";

const router: Router = express.Router();

// Affiliate link management routes
router.post("/generate-link", authenticateToken, AffiliateLinkController.generateLink);
router.get("/", authenticateToken, GetAllAffiliateLinksController.getAllAffiliateLinks);

// Public affiliate click tracking route (no auth required, rejects authenticated users)
router.get("/click/:token/:sessionId", AffiliateLinkClickController.trackClick);

export default router;