import { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { reorderPagesController } from "../controller";

const router = Router();

router.put("/funnels/:funnelId/pages/reorder", authenticateToken, reorderPagesController);

export default router;