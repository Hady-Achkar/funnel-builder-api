import { Router } from "express";
import { PaymentWebhookController } from "../controllers/subscription/webhook";
import { CancelSubscriptionController } from "../controllers/subscription/cancel";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Webhook endpoint (no authentication required - external service)
router.post("/webhook", PaymentWebhookController.handleWebhook);

// Cancel subscription endpoint (authenticated)
router.post("/cancel", authenticateToken, CancelSubscriptionController.cancel);

export default router;
