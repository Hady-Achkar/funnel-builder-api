import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { createInsightController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.post("/", createInsightController);

export default router;