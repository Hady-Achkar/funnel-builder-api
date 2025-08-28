import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { getAllInsightSubmissionsController } from "../controller/getAll.controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.get("/:funnelId", getAllInsightSubmissionsController);

export default router;