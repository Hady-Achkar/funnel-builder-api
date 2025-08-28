import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { ConfigureWorkspaceController } from "../controller";

const router: Router = express.Router();

router.patch("/", authenticateToken, ConfigureWorkspaceController.configure);

export default router;