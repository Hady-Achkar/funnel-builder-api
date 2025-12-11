import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { getSessionsByFunnelController } from "../../controllers/session/get-by-funnel";
import { getSessionHistoryController } from "../../controllers/session/get-history";

const router: Router = express.Router();

router.use(authenticateToken);

// More specific routes first
router.get("/:workspaceSlug/:funnelSlug/history", getSessionHistoryController);
router.get("/:workspaceSlug/:funnelSlug", getSessionsByFunnelController);

export default router;
