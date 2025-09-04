import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { InviteMemberService } from "../../../services/workspace/invite-member";

export class InviteMemberController {
  static async inviteMember(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { slug } = req.params;
      const requestData = { ...req.body, workspaceSlug: slug };
      const result = await InviteMemberService.inviteMember(
        userId,
        requestData
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
