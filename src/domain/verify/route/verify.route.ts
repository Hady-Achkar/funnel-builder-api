import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { VerifyDomainController } from "../controller";

const router: Router = express.Router();

router.post("/:id", authenticateToken, VerifyDomainController.verify);

export default router;
