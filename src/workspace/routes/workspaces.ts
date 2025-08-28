import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { getAllWorkspacesController } from "../getAll/controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.get("/", getAllWorkspacesController);

export default router;