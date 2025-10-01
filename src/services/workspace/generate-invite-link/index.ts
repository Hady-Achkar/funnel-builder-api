import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
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

      const linkId = uuidv4();

      const payload = {
        workspaceId: workspace.id,
        workspaceSlug: workspace.slug,
        role: String(data.role),
        type: "workspace_direct_link" as const,
        linkId,
        createdBy: creatorUserId,
      };

      const invitationToken = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: data.expiresIn,
      } as jwt.SignOptions);

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
