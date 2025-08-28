import { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { updateFunnelSettingsController } from "../update/controller";
import { getFunnelSettingsController } from "../get/controller";

const router = Router();

// Public endpoint - no authentication required
router.get("/:funnelId", getFunnelSettingsController);

// Protected endpoint - requires authentication
router.put("/:id", authenticateToken, updateFunnelSettingsController);

export default router;