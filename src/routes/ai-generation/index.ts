/**
 * AI Generation Routes
 * Routes for AI-powered funnel generation
 */

import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { generateFunnelController } from "../../controllers/ai-generation/generate-funnel";
import { modifyFunnelController } from "../../controllers/ai-generation/modify-funnel";
import { getPromptBalanceController } from "../../controllers/ai-generation/get-prompt-balance";
import { getGenerationHistoryController } from "../../controllers/ai-generation/get-generation-history";
import { estimatePromptsController } from "../../controllers/ai-generation/estimate-prompts";

const router: Router = express.Router();

// Unified generation endpoint - batch mode for consistent content quality
router.post("/generate", authenticateToken, generateFunnelController);

// Modify existing funnel endpoint - AI-powered funnel modification
router.post("/modify", authenticateToken, modifyFunnelController);

// Prompt-based endpoints
router.get("/balance", authenticateToken, getPromptBalanceController);

router.get("/history", authenticateToken, getGenerationHistoryController);

router.post("/estimate", authenticateToken, estimatePromptsController);

export default router;
