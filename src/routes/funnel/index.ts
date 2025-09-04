import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { createFunnelController } from "../../controllers/funnel/create";
import { updateFunnelController } from "../../controllers/funnel/update";
import { getAllFunnelsController } from "../../controllers/funnel/getAll";
import { getFunnelController } from "../../controllers/funnel/get";
import { deleteFunnelController } from "../../controllers/funnel/delete";
import { createFromTemplateController } from "../../controllers/funnel/createFromTemplate";
import { duplicateFunnelController } from "../../controllers/funnel/duplicate";

const router: Router = express.Router();

router.use(authenticateToken);

router.post("/", createFunnelController);
router.post("/from-template/:templateId", createFromTemplateController);
router.post("/:id/duplicate", duplicateFunnelController);
router.get("/workspace/:workspaceSlug", getAllFunnelsController);
router.get("/:id", getFunnelController);
router.put("/:id", updateFunnelController);
router.delete("/:id", deleteFunnelController);

export default router;