import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { createFormSubmissionController } from "../../controllers/form-submission/create";
import { getAllFormSubmissionsController } from "../../controllers/form-submission/get-all";

const router: Router = express.Router();

// Create form submission (public endpoint - no auth required)
router.post("/", createFormSubmissionController);

// Get all form submissions for funnel (requires authentication)
router.get("/:funnelId", authenticateToken, getAllFormSubmissionsController);

export default router;