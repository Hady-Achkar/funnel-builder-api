import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { getAllFunnelsController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.get("/workspace/:workspaceId", getAllFunnelsController);

export default router;
