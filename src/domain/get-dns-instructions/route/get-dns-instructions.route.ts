import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { GetDNSInstructionsController } from "../controller";

const router: Router = express.Router();

// GET /api/domains/:id/dns-instructions
router.get("/:id", authenticateToken, GetDNSInstructionsController.getByDomainId);

// POST /api/domains/dns-instructions/by-hostname
router.post("/by-hostname", authenticateToken, GetDNSInstructionsController.getByHostname);

export default router;