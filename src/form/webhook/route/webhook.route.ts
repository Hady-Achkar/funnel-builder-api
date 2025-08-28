import { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { configureWebhookController } from "../controller";

const router = Router();

router.put("/:formId/configure", authenticateToken, configureWebhookController);

export default router;