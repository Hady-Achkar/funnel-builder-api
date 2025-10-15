import { Router } from "express";
import { CreatePaymentLinkController } from "../controllers/payment/create-payment-link";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post(
  "/create-payment-link",
  authenticateToken,
  CreatePaymentLinkController.createPaymentLink
);

export default router;
