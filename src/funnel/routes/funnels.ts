import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { createFunnelController } from "../create/controller";
import { updateFunnelController } from "../update/controller";
import { getAllFunnelsController } from "../getAll/controller";
import { getFunnelController } from "../get/controller";
import { deleteFunnelController } from "../delete/controller";
import { createFromTemplateController } from "../createFromTemplate/controller";
import { duplicateFunnelController } from "../duplicate/controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.post("/", createFunnelController);
router.post("/from-template/:templateId", createFromTemplateController);
router.post("/:id/duplicate", duplicateFunnelController);
router.get("/workspace/:workspaceId", getAllFunnelsController);
router.get("/:id", getFunnelController);
router.put("/:id", updateFunnelController);
router.delete("/:id", deleteFunnelController);

export default router;
