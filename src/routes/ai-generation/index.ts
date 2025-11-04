/**
 * AI Generation Routes
 * Routes for AI-powered funnel generation
 */

import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { generateFunnelController } from "../../controllers/ai-generation/generate-funnel";
import { getTokenBalanceController } from "../../controllers/ai-generation/get-token-balance";
import { getGenerationHistoryController } from "../../controllers/ai-generation/get-generation-history";
import { estimateTokensController } from "../../controllers/ai-generation/estimate-tokens";

const router: Router = express.Router();

// Unified generation endpoint - batch mode for consistent content quality
router.post("/generate", authenticateToken, generateFunnelController);

router.get("/balance", authenticateToken, getTokenBalanceController);

router.get("/history", authenticateToken, getGenerationHistoryController);

router.post("/estimate", authenticateToken, estimateTokensController);

export default router;
