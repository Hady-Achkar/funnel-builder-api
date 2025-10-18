import { Router } from "express";
import { PaymentWebhookController } from "../controllers/subscription/webhook";

const router = Router();

// Webhook endpoint (no authentication required - external service)
router.post("/webhook", PaymentWebhookController.handleWebhook);

export default router;
