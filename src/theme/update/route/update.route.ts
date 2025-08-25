import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { updateThemeController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.put("/:id", updateThemeController);

export default router;