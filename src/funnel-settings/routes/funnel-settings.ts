import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { updateFunnelSettingsController } from "../update/controller";
import { getFunnelSettingsController } from "../get/controller";
import { lockFunnelController } from "../lock-funnel/controller";
import { unlockFunnelController } from "../unlock-funnel/controller";
import { verifyPasswordController } from "../verify-password/controller";

const router = Router();

// Public endpoints - no authentication required
router.get("/:funnelId", getFunnelSettingsController);
router.post("/verify-password/:funnelId", verifyPasswordController);

// Protected endpoints - requires authentication
router.put("/:id", authenticateToken, updateFunnelSettingsController);
router.post("/lock-funnel/:funnelId", authenticateToken, lockFunnelController);
router.post("/unlock-funnel/:funnelId", authenticateToken, unlockFunnelController);

export default router;