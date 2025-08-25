import { Router } from "express";
import { updateFunnelController } from "../controller";

const router = Router();

router.put("/:id", updateFunnelController);

export default router;