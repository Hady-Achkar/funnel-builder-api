import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { createPageController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.post("/", createPageController);

export default router;