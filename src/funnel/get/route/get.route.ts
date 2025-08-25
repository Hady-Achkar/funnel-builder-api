import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { getFunnelController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.get("/:id", getFunnelController);

export default router;