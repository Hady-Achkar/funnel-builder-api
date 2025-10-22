import { Router } from "express";
import { RequestPayoutController } from "../../controllers/payout/request";
import { authenticateToken } from "../../middleware/auth";

const router = Router();

// Payout request route
router.post("/request", authenticateToken, RequestPayoutController.create);

export default router;
