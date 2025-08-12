import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { getImageFolderByIdController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.get("/:id", getImageFolderByIdController);

export default router;
