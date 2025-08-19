import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { bulkDeleteImagesController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.delete("/bulk", bulkDeleteImagesController);

export default router;