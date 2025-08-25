import { Router } from "express";
import { createFunnelController } from "../controller";

const router = Router();

router.post("/", createFunnelController);

export default router;