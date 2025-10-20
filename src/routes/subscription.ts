import { Router } from "express";
import { FirstSubscriptionWebhookController } from "../controllers/subscription/first-subscription-webhook";
import { CancelSubscriptionController } from "../controllers/subscription/cancel";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post(
  "/first-subscription-webhook",
  FirstSubscriptionWebhookController.handleWebhook
);

// Cancel subscription endpoint (authenticated)
router.post("/cancel", authenticateToken, CancelSubscriptionController.cancel);

export default router;
