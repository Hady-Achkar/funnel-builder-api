import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { updateFunnelSettingsController } from "../../controllers/funnel-settings/update";
import { getFunnelSettingsController } from "../../controllers/funnel-settings/get";
import { lockFunnelController } from "../../controllers/funnel-settings/lock-funnel";
import { unlockFunnelController } from "../../controllers/funnel-settings/unlock-funnel";
import { verifyPasswordController } from "../../controllers/funnel-settings/verify-password";

const router = Router();

// Public endpoints - no authentication required
router.get("/:funnelId", getFunnelSettingsController);
router.post("/verify-password/:funnelId", verifyPasswordController);

// Protected endpoints - requires authentication
router.put("/:id", authenticateToken, updateFunnelSettingsController);
router.post("/lock-funnel/:funnelId", authenticateToken, lockFunnelController);
router.post("/unlock-funnel/:funnelId", authenticateToken, unlockFunnelController);

export default router;