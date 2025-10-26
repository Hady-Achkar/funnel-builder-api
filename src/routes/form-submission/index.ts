import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { createFormSubmissionController } from "../../controllers/form-submission/create";
import { getAllFormSubmissionsController } from "../../controllers/form-submission/get-all";
import { deleteFormSubmissionController } from "../../controllers/form-submission/delete";

const router: Router = express.Router();

// Create form submission (public endpoint - no auth required)
router.post("/", createFormSubmissionController);

// Get all form submissions for funnel (requires authentication)
router.get("/:funnelId", authenticateToken, getAllFormSubmissionsController);

// Delete a single form submission (requires authentication)
router.delete("/:submissionId", authenticateToken, deleteFormSubmissionController);

export default router;