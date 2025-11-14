import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { updateFunnelSettingsController } from "../../controllers/funnel-settings/update";
import { getFunnelSettingsController } from "../../controllers/funnel-settings/get";
import { lockFunnelController } from "../../controllers/funnel-settings/lock-funnel";
import { unlockFunnelController } from "../../controllers/funnel-settings/unlock-funnel";
import { verifyPasswordController } from "../../controllers/funnel-settings/verify-password";
import { updatePasswordController } from "../../controllers/funnel-settings/update-password";

const router = Router();

// Public endpoints - no authentication required
router.post("/verify-password", verifyPasswordController);

// Protected endpoints - requires authentication
router.get("/:workspaceSlug/:funnelSlug", authenticateToken, getFunnelSettingsController);
router.put("/:workspaceSlug/:funnelSlug", authenticateToken, updateFunnelSettingsController);
router.post("/lock-funnel/:workspaceSlug/:funnelSlug", authenticateToken, lockFunnelController);
router.post("/unlock-funnel/:workspaceSlug/:funnelSlug", authenticateToken, unlockFunnelController);
router.post("/update-password/:workspaceSlug/:funnelSlug", authenticateToken, updatePasswordController);

export default router;