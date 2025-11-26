import { Router } from "express";
import { CreatePaymentLinkController } from "../controllers/payment/create-payment-link";
import { CreateAddonPaymentLinkController } from "../controllers/payment/create-addon-payment-link";
import { authenticateToken, optionalAuthenticateToken } from "../middleware/auth";

const router = Router();

// Optional auth - supports both:
// 1. Authenticated users (existing behavior)
// 2. Public Partner Plan requests (when plan: "partner" is passed)
router.post(
  "/create-payment-link",
  optionalAuthenticateToken,
  CreatePaymentLinkController.createPaymentLink
);

router.post(
  "/create-addon-payment-link",
  authenticateToken,
  CreateAddonPaymentLinkController.createAddonPaymentLink
);

export default router;
