import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { setActiveThemeController } from "../../controllers/theme/set-active-theme";

const router: Router = express.Router();

router.use(authenticateToken);

router.put("/:funnelId/active-theme", setActiveThemeController);

export default router;
