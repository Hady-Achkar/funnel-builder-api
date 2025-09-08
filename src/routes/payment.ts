import { Router } from "express";
import { CreatePaymentLinkController } from "../controllers/payment/create-payment-link";

const router = Router();

router.post("/create-payment-link", CreatePaymentLinkController.createPaymentLink);

export default router;