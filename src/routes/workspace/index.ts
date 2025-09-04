import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { getAllWorkspacesController } from "../../controllers/workspace/get-all";
import { ConfigureWorkspaceController } from "../../controllers/workspace/configure";
import { CreateWorkspaceController } from "../../controllers/workspace/create";
import { GetWorkspaceController } from "../../controllers/workspace/get";

const router: Router = express.Router();

router.use(authenticateToken);

// Create new workspace
router.post("/", CreateWorkspaceController.create);

// Get all workspaces for user
router.get("/", getAllWorkspacesController);

// Get single workspace by slug
router.get("/:slug", GetWorkspaceController.getBySlug);

// Configure workspace (roles, permissions, allocations)
router.patch("/configure", ConfigureWorkspaceController.configure);

export default router;