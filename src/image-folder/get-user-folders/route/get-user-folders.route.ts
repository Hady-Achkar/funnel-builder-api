import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { getUserImageFoldersController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.get("/", getUserImageFoldersController);

export default router;
