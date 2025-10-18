import { Router } from "express";
import { CreatePaymentLinkController } from "../controllers/payment/create-payment-link";
import { CreateAddonPaymentLinkController } from "../controllers/payment/create-addon-payment-link";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post(
  "/create-payment-link",
  authenticateToken,
  CreatePaymentLinkController.createPaymentLink
);

router.post(
  "/create-addon-payment-link",
  authenticateToken,
  CreateAddonPaymentLinkController.createAddonPaymentLink
);

export default router;
