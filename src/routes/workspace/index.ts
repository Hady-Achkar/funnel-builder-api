import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { getAllWorkspacesController } from "../../controllers/workspace/get-all";
import { ConfigureWorkspaceController } from "../../controllers/workspace/configure";

const router: Router = express.Router();

router.use(authenticateToken);

// Get all workspaces for user
router.get("/", getAllWorkspacesController);

// Configure workspace (roles, permissions, allocations)
router.patch("/configure", ConfigureWorkspaceController.configure);

export default router;