import { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { duplicatePageController } from "../controller";

const router = Router();

router.post("/:pageId/duplicate", authenticateToken, duplicatePageController);

export default router;