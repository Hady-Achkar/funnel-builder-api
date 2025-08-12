import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { createImageFolderController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.post("/", createImageFolderController);

export default router;
