import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { CreateSubdomainController } from "../controller";

const router: Router = express.Router();

router.post("/", authenticateToken, CreateSubdomainController.create);

export default router;