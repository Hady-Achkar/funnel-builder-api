import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { DeleteDomainController } from "../../controllers/domain/delete";

const router: Router = express.Router();

router.delete("/:id", authenticateToken, DeleteDomainController.delete);

export { router as deleteDomainRouter };