import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { createFunnelController } from "../../controllers/funnel/create";
import { updateFunnelController } from "../../controllers/funnel/update";
import { getAllFunnelsController } from "../../controllers/funnel/getAll";
import { getFunnelController } from "../../controllers/funnel/get";
import { deleteFunnelController } from "../../controllers/funnel/delete";
import { createFromTemplateController } from "../../controllers/funnel/createFromTemplate";
import { duplicateFunnelController } from "../../controllers/funnel/duplicate";
import { GetFunnelsSummaryController } from "../../controllers/funnel/get-funnels-summary";
const router: Router = express.Router();

router.use(authenticateToken);

router.post("/", createFunnelController);
router.post("/from-template/:templateId", createFromTemplateController);
router.get(
  "/:workspaceSlug/summary",
  GetFunnelsSummaryController.getFunnelsSummary
);
router.get("/workspace/:workspaceSlug", getAllFunnelsController);
router.get("/:workspaceSlug/:funnelSlug", getFunnelController);
router.put("/:workspaceSlug/:funnelSlug", updateFunnelController);
router.delete("/:workspaceSlug/:funnelSlug", deleteFunnelController);
router.post("/:workspaceSlug/:funnelSlug/duplicate", duplicateFunnelController);

export default router;
