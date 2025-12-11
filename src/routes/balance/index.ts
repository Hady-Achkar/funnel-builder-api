import { Router } from "express";
import { GetBalanceHistoryController } from "../../controllers/balance/get-history";
import { GetEarningsStatsController } from "../../controllers/balance/get-earnings-stats";
import { authenticateToken } from "../../middleware/auth";

const router = Router();

/**
 * @route   GET /api/balance/history
 * @desc    Get user withdrawal history with pagination, filtering, and sorting
 * @access  Private (requires authentication)
 */
router.get("/history", authenticateToken, GetBalanceHistoryController.getHistory);

/**
 * @route   GET /api/balance/earnings-stats
 * @desc    Get user balance info and affiliate statistics
 * @access  Private (requires authentication)
 */
router.get("/earnings-stats", authenticateToken, GetEarningsStatsController.getEarningsStats);

export default router;
