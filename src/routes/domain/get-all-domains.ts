import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { GetAllDomainsController } from "../../controllers/domain/get-all-domains";

const router: Router = express.Router();

// GET /api/domains/:workspaceId
router.get("/:workspaceId", authenticateToken, GetAllDomainsController.getAllDomains);

export default router;