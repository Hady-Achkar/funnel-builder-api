import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { VerifyDomainController } from "../controller";

const router: Router = express.Router();

// POST /api/domains/verify
router.post("/", authenticateToken, VerifyDomainController.verify);

export default router;