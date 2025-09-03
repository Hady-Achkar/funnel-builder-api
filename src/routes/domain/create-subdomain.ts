import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { CreateSubdomainController } from "../../controllers/domain/create-subdomain";

const router: Router = express.Router();

router.post("/", authenticateToken, CreateSubdomainController.create);

export { router as createSubdomainRouter };