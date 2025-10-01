import jwt from "jsonwebtoken";
import {
  GenerateInviteLinkRequest,
  GenerateInviteLinkResponse,
} from "../../../types/workspace/generate-invite-link";
import {
  validateWorkspaceExists,
  validateInviterPermissions,
} from "../../../helpers/workspace/invite-member/validation";

export class GenerateInviteLinkService {
  static async generateInviteLink(
    creatorUserId: number,
    data: GenerateInviteLinkRequest
  ): Promise<GenerateInviteLinkResponse> {
    try {
      const workspace = await validateWorkspaceExists(data.workspaceSlug);

      validateInviterPermissions(workspace, creatorUserId);

      const invitationToken = jwt.sign(
        {
          workspaceId: workspace.id,
          workspaceSlug: workspace.slug,
          role: data.role,
          type: "workspace_direct_link",
          createdBy: creatorUserId,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      const link = `${process.env.FRONTEND_URL}/join-workspace?token=${invitationToken}`;

      return {
        link,
        token: invitationToken,
      };
    } catch (error) {
      throw error;
    }
  }
}
