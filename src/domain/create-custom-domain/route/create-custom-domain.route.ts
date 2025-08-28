import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { CreateCustomDomainController } from "../controller";

const router: Router = express.Router();

router.post("/", authenticateToken, CreateCustomDomainController.create);

export default router;
