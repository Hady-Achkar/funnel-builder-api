import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { createInsightController } from "../../controllers/insight/create";
import { updateInsightController } from "../../controllers/insight/update";
import { deleteInsightController } from "../../controllers/insight/delete";

const router: Router = express.Router();

router.use(authenticateToken);

router.post("/:workspaceSlug/:funnelSlug", createInsightController);

router.put("/:id", updateInsightController);

router.delete("/:id", deleteInsightController);

export default router;