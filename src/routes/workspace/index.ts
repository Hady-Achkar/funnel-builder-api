import express, { Router } from "express";
import multer from "multer";
import { authenticateToken } from "../../middleware/auth";
import { getAllWorkspacesController } from "../../controllers/workspace/get-all";
import { ConfigureWorkspaceController } from "../../controllers/workspace/configure";
import { CreateWorkspaceController } from "../../controllers/workspace/create";
import { GetWorkspaceController } from "../../controllers/workspace/get";
import { InviteMemberController } from "../../controllers/workspace/invite-member";
import { uploadWorkspaceImageController } from "../../controllers/workspace/upload-image";

const router: Router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.use(authenticateToken);

// Create new workspace
router.post("/", CreateWorkspaceController.create);

// Get all workspaces for user
router.get("/", getAllWorkspacesController);

// Get single workspace by slug
router.get("/:slug", GetWorkspaceController.getBySlug);

// Configure workspace (roles, permissions, allocations)
router.patch("/configure", ConfigureWorkspaceController.configure);

// Invite member to workspace
router.post("/invite-member/:slug", InviteMemberController.inviteMember);

// Upload workspace image
router.post(
  "/:slug/upload-image",
  upload.single("image"),
  uploadWorkspaceImageController
);

export default router;
