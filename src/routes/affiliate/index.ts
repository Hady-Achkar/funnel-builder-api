import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { AffiliateLinkController } from "../../controllers/affiliate";

const router: Router = express.Router();

// Affiliate link management routes
router.post("/generate-link", authenticateToken, AffiliateLinkController.generateLink);

export default router;