import { getPrisma } from "../../../lib/prisma";
import {
  JoinByLinkRequest,
  JoinByLinkResponse,
} from "../../../types/workspace/join-by-link";
import { DirectLinkTokenPayload } from "../../../types/workspace/generate-invite-link";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../../../errors";
import jwt from "jsonwebtoken";
import { MembershipStatus } from "../../../generated/prisma-client";
import { cacheService } from "../../cache/cache.service";

export class JoinByLinkService {
  async joinByLink(
    userId: number,
    data: JoinByLinkRequest
  ): Promise<JoinByLinkResponse> {
    try {
      const prisma = getPrisma();

      let tokenPayload: DirectLinkTokenPayload;
      try {
        tokenPayload = jwt.verify(
          data.token,
          process.env.JWT_SECRET!
        ) as DirectLinkTokenPayload;
      } catch (error) {
        throw new BadRequestError("Invalid or expired invitation link");
      }

      if (tokenPayload.type !== "workspace_direct_link") {
        throw new BadRequestError("Invalid invitation link type");
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: tokenPayload.workspaceId },
        select: { id: true, name: true, slug: true, ownerId: true },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      const existingMembership = await prisma.workspaceMember.findFirst({
        where: {
          userId: user.id,
          workspaceId: workspace.id,
          status: {
            in: [MembershipStatus.ACTIVE, MembershipStatus.PENDING],
          },
        },
      });

      if (existingMembership) {
        if (existingMembership.status === MembershipStatus.ACTIVE) {
          throw new ForbiddenError(
            "You are already a member of this workspace"
          );
        } else {
          throw new ForbiddenError(
            "You already have a pending invitation to this workspace"
          );
        }
      }

      const rolePermTemplate =
        await prisma.workspaceRolePermTemplate.findUnique({
          where: {
            workspaceId_role: {
              workspaceId: workspace.id,
              role: tokenPayload.role as any,
            },
          },
        });

      const permissions = rolePermTemplate?.permissions || [];

      const newMember = await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          email: user.email,
          workspaceId: workspace.id,
          role: tokenPayload.role as any,
          permissions,
          status: MembershipStatus.ACTIVE,
          invitedBy: tokenPayload.createdBy,
          joinedAt: new Date(),
        },
      });

      try {
        await cacheService.del(`slug:${workspace.slug}`, {
          prefix: "workspace",
        });
        console.log(
          `[Cache] Invalidated workspace cache for ${workspace.slug} after user joined via direct link`
        );
      } catch (cacheError) {
        console.error("Failed to invalidate workspace cache:", cacheError);
      }

      return {
        message: "Successfully joined workspace",
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          role: newMember.role,
          permissions: newMember.permissions,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
