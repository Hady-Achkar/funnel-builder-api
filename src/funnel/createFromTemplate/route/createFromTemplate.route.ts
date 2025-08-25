import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { createFromTemplateController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.post("/from-template/:templateId", createFromTemplateController);

export default router;