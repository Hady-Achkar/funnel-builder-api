import express, { Router } from "express";
import multer from "multer";
import { authenticateToken } from "../../middleware/auth";
import { getAllWorkspacesController } from "../../controllers/workspace/get-all";
import { ConfigureWorkspaceController } from "../../controllers/workspace/configure";
import { CreateWorkspaceController } from "../../controllers/workspace/create";
import { GetWorkspaceController } from "../../controllers/workspace/get";
import { InviteMemberController } from "../../controllers/workspace/invite-member";
import { AcceptInvitationController } from "../../controllers/workspace/accept-invitation";
import { uploadWorkspaceImageController } from "../../controllers/workspace/upload-image";
import { UpdateWorkspaceController } from "../../controllers/workspace/update";
import { DeleteWorkspaceController } from "../../controllers/workspace/delete";
import { LeaveWorkspaceController } from "../../controllers/workspace/leave";
import { GetUserWorkspacesSummaryController } from "../../controllers/workspace/get-user-summary";
import { GenerateInviteLinkController } from "../../controllers/workspace/generate-invite-link";
import { JoinByLinkController } from "../../controllers/workspace/join-by-link";

const router: Router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.use(authenticateToken);

// Create new workspace
router.post("/", CreateWorkspaceController.create);

// Get all workspaces for user
router.get("/", getAllWorkspacesController);

// Get user workspaces summary
router.get("/summary", GetUserWorkspacesSummaryController.getUserWorkspacesSummary);

// Get single workspace by slug
router.get("/:slug", GetWorkspaceController.getBySlug);

// Configure workspace (roles, permissions, allocations) - legacy endpoint
router.patch("/configure", ConfigureWorkspaceController.configure);

// Update workspace - comprehensive endpoint for all workspace settings
router.put("/:slug", UpdateWorkspaceController.update);

// Invite member to workspace
router.post("/invite-member/:slug", InviteMemberController.inviteMember);

// Accept workspace invitation
router.post("/accept-invitation", AcceptInvitationController.acceptInvitation);

// Generate workspace invite link
router.post("/generate-invite-link/:slug", GenerateInviteLinkController.generateInviteLink);

// Join workspace via direct link
router.post("/join-by-link", JoinByLinkController.joinByLink);

// Upload workspace image
router.post(
  "/:slug/upload-image",
  upload.single("image"),
  uploadWorkspaceImageController
);

// Leave workspace
router.post("/:slug/leave", LeaveWorkspaceController.leave);

// Delete workspace
router.delete("/:slug", DeleteWorkspaceController.deleteBySlug);

export default router;
