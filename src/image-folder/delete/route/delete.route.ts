import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { deleteImageFolderController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.delete("/:id", deleteImageFolderController);

export default router;
