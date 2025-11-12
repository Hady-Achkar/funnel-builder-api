import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { createInsightSubmissionController } from "../../controllers/insight-submission/create";
import { getAllInsightSubmissionsController } from "../../controllers/insight-submission/get-all";

const router: Router = express.Router();

// Create insight submission - PUBLIC endpoint (no auth required)
router.post("/", createInsightSubmissionController);

// Get all insight submissions - requires authentication
router.get("/:workspaceSlug/:funnelSlug", authenticateToken, getAllInsightSubmissionsController);

export default router;