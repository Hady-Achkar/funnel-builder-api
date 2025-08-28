import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { getAllWorkspacesController } from "../getAll/controller";
import { configureWorkspaceRouter } from "../configure";

const router: Router = express.Router();

router.use(authenticateToken);

router.get("/", getAllWorkspacesController);
router.use("/configure", configureWorkspaceRouter);

export default router;