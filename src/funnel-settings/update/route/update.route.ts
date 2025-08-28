import { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { updateFunnelSettingsController } from "../controller";

const router = Router();

router.put("/:id", authenticateToken, updateFunnelSettingsController);

export default router;