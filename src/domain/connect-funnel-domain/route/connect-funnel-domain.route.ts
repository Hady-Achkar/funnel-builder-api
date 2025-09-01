import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { ConnectFunnelDomainController } from "../controller";

const router: Router = express.Router();

router.post("/", authenticateToken, ConnectFunnelDomainController.connect);

export default router;