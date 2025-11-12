import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { ConnectController } from "../../controllers/domain-funnel/connect";
import { GetConnectionsController } from "../../controllers/domain-funnel/get-connections";
import { GetFunnelConnectionController } from "../../controllers/domain-funnel/get-funnel-connection";

const router: Router = express.Router();

// Domain-funnel routes
router.post("/connect", authenticateToken, ConnectController.connect);
router.get(
  "/connections/:workspaceSlug",
  authenticateToken,
  GetConnectionsController.getConnections
);
router.get(
  "/:workspaceSlug/:funnelSlug/connection",
  authenticateToken,
  GetFunnelConnectionController.getFunnelConnection
);

export default router;
