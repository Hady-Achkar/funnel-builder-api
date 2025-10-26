import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { getSessionsByFunnelController } from "../../controllers/session/get-by-funnel";

const router: Router = express.Router();

router.use(authenticateToken);

router.get("/:funnelId", getSessionsByFunnelController);

export default router;
