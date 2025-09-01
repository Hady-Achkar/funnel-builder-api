import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { GetDNSInstructionsController } from "../controller";

const router: Router = express.Router();

// GET /api/domains/dns-instructions/:id
router.get("/:id", authenticateToken, GetDNSInstructionsController.getByDomainId);

export default router;