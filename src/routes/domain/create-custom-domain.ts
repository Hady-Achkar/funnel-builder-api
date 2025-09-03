import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { CreateCustomDomainController } from "../../controllers/domain/create-custom-domain";

const router: Router = express.Router();

router.post("/", authenticateToken, CreateCustomDomainController.create);

export { router as createCustomDomainRouter };