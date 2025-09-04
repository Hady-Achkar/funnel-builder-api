import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { CreateCustomDomainController } from "../../controllers/domain/create-custom-domain";
import { CreateSubdomainController } from "../../controllers/domain/create-subdomain";
import { DeleteDomainController } from "../../controllers/domain/delete";
import { VerifyDomainController } from "../../controllers/domain/verify";
import { GetDNSInstructionsController } from "../../controllers/domain/get-dns-instructions";
import { GetAllDomainsController } from "../../controllers/domain/get-all-domains";

const router: Router = express.Router();

// Domain management routes
router.post("/create-custom-domain", authenticateToken, CreateCustomDomainController.create);
router.post("/create-subdomain", authenticateToken, CreateSubdomainController.create);
router.delete("/:id", authenticateToken, DeleteDomainController.delete);
router.post("/verify/:id", authenticateToken, VerifyDomainController.verify);
router.get("/dns-instructions/:id", authenticateToken, GetDNSInstructionsController.getByDomainId);
router.get("/:workspaceSlug", authenticateToken, GetAllDomainsController.getAllDomains);

export default router;