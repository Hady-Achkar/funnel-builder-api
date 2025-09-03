import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { updateThemeController } from "../../controllers/theme/update";

const router: Router = express.Router();

router.use(authenticateToken);

router.put("/:id", updateThemeController);

export default router;