import { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { deletePageController } from "../controller";

const router = Router();

router.delete("/:id", authenticateToken, deletePageController);

export default router;