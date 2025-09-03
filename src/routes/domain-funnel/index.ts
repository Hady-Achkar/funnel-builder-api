import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { ConnectController } from "../../controllers/domain-funnel/connect";
import { GetConnectionsController } from "../../controllers/domain-funnel/get-connections";

const router: Router = express.Router();

// Domain-funnel routes
router.post("/connect", authenticateToken, ConnectController.connect);
router.get("/connections/:workspaceId", authenticateToken, GetConnectionsController.getConnections);

export default router;