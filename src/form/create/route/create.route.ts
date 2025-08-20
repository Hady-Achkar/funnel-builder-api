import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { createFormController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.post("/", createFormController);

export default router;