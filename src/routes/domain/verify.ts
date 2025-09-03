import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { VerifyDomainController } from "../../controllers/domain/verify";

const router: Router = express.Router();

router.post("/:id", authenticateToken, VerifyDomainController.verify);

export { router as verifyDomainRouter };