import { Router } from "express";
import { RequestPayoutController } from "../../controllers/payout/request";
import { UpdatePayoutController } from "../../controllers/payout/update";
import { authenticateToken } from "../../middleware/auth";

const router = Router();

// Payout request route
router.post("/request", authenticateToken, RequestPayoutController.create);

// Payout update route (admin or user self-cancellation)
router.put("/:id", authenticateToken, UpdatePayoutController.update);

export default router;
