import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { createFormController } from "../../controllers/form/create";
import { updateFormController } from "../../controllers/form/update";
import { deleteFormController } from "../../controllers/form/delete";
import { configureWebhookController } from "../../controllers/form/webhook";

const router: Router = express.Router();

// Form CRUD routes
router.post("/:workspaceSlug/:funnelSlug", authenticateToken, createFormController);
router.put("/:id", authenticateToken, updateFormController);
router.delete("/:id", authenticateToken, deleteFormController);

// Webhook configuration route
router.put("/webhook/:formId/configure", authenticateToken, configureWebhookController);

export default router;