import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { GetConnectionsController } from "../controller";

const router: Router = express.Router();

router.get(
  "/:workspaceId",
  authenticateToken,
  GetConnectionsController.getConnections
);

export default router;
