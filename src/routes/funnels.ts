import express, { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { FunnelController } from "../controllers/funnel.controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.post("/", FunnelController.createFunnel);
router.get("/", FunnelController.getUserFunnels);
router.get("/:id", FunnelController.getFunnelById);
router.put("/:id", FunnelController.updateFunnel);
router.delete("/:id", FunnelController.deleteFunnel);
router.post("/:id/duplicate", FunnelController.duplicateFunnel);

export default router;
