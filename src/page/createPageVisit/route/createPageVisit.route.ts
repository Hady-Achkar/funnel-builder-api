import { Router } from "express";
import { createPageVisitController } from "../controller";

const router = Router();

router.post("/:pageId/visit", createPageVisitController);

export default router;