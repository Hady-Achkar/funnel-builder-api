import { Router } from "express";
import { createSubscriptionController } from "../controllers/subscription/create";

const router = Router();

router.post("/create", createSubscriptionController);

export default router;