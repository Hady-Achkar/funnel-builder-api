import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { updateInsightController } from "../controller/update.controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.put("/:id", updateInsightController);

export default router;