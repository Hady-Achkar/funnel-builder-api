import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { getAllFormSubmissionsController } from "../controller/getAll.controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.get("/:funnelId", getAllFormSubmissionsController);

export default router;
