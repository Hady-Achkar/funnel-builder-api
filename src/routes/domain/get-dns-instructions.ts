import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { GetDNSInstructionsController } from "../../controllers/domain/get-dns-instructions";

const router: Router = express.Router();

// GET /api/domains/dns-instructions/:id
router.get("/:id", authenticateToken, GetDNSInstructionsController.getByDomainId);

export { router as getDNSInstructionsRouter };