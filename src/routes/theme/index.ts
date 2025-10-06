import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { setActiveThemeController } from "../../controllers/theme/set-active-theme";
import { updateThemeController } from "../../controllers/theme/update";
import { getGlobalThemesController } from "../../controllers/theme/get-global-themes";

const router: Router = express.Router();

router.use(authenticateToken);

router.get("/global", getGlobalThemesController);
router.put("/:id", updateThemeController);
router.put("/:funnelId/active-theme", setActiveThemeController);

export default router;
