import { Router } from "express";
import { GetBalanceHistoryController } from "../../controllers/balance/get-history";
import { authenticateToken } from "../../middleware/auth";

const router = Router();

/**
 * @route   GET /api/balance/history
 * @desc    Get user balance and withdrawal history with pagination, filtering, and sorting
 * @access  Private (requires authentication)
 */
router.get("/history", authenticateToken, GetBalanceHistoryController.getHistory);

export default router;
