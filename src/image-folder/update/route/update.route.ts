import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { updateImageFolderController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.put("/:id", updateImageFolderController);

export default router;
