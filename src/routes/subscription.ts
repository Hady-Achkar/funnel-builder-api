import { Router } from "express";
import { SubscriptionCreateController } from "../controllers/subscription/create";

const router = Router();

router.post("/create", SubscriptionCreateController.createSubscription);

export default router;