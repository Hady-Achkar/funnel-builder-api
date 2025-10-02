import { getPrisma } from "../../../lib/prisma";
import {
  RegisterRequest,
  RegisterResponse,
  RegisterUserResponse,
  RegisterWorkspaceResponse,
} from "../../../types/auth/register";
import { UserWorkspaceAllocations } from "../../../utils/user-workspace-allocations";
import { TrialPeriodCalculator } from "../../../utils/trial-period";
import { hashPassword } from "./utils/hash-password";
import {
  generateVerificationToken,
  getVerificationTokenExpiry,
} from "./utils/generate-verification-token";
import { WorkspaceInvitationProcessor } from "./utils/workspace-invitation.utils";
import { sendVerificationEmail } from "../../../helpers/auth/emails/register";
import { cacheService } from "../../cache/cache.service";

export class RegisterService {
  static async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const prisma = getPrisma();

      const hashedPassword = await hashPassword(data.password);
      const maximumWorkspaces = UserWorkspaceAllocations.getBaseAllocation(
        data.plan
      );
      const { trialStartDate, trialEndDate } =
        TrialPeriodCalculator.getTrialDates(data.trialPeriod);
      const verificationToken = generateVerificationToken(data);
      const verificationTokenExpiresAt = getVerificationTokenExpiry();
      const user = await prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          password: hashedPassword,
          verified: false,
          verificationToken,
          verificationTokenExpiresAt,
          isAdmin: data.isAdmin,
          plan: data.plan,
          maximumWorkspaces,
          trialStartDate,
          trialEndDate,
        },
      });

      // Send verification email (non-blocking, don't fail registration if email fails)
      try {
        await sendVerificationEmail(
          user.email,
          user.firstName,
          verificationToken
        );
      } catch (error) {
        console.error("Failed to send verification email:", error);
        // Continue with registration even if email fails
      }

      // Process workspace invitation if token provided
      let workspaceData: RegisterWorkspaceResponse | undefined;
      if (data.workspaceInvitationToken) {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          throw new Error("JWT secret not configured");
        }

        // Decode token to get workspace ID
        const tokenPayload = WorkspaceInvitationProcessor.decodeInvitationToken(
          data.workspaceInvitationToken,
          jwtSecret
        );

        if (tokenPayload && tokenPayload.workspaceId) {
          // Get workspace
          const workspace = await prisma.workspace.findUnique({
            where: { id: tokenPayload.workspaceId },
            select: { id: true, name: true, slug: true },
          });

          if (workspace) {
            // Find pending membership
            const pendingMember = await prisma.workspaceMember.findFirst({
              where: {
                email: user.email,
                workspaceId: workspace.id,
                status: "PENDING",
              },
            });

            if (pendingMember) {
              // Update membership to active and connect user
              const updateData =
                WorkspaceInvitationProcessor.prepareMembershipUpdate();
              const updatedMember = await prisma.workspaceMember.update({
                where: { id: pendingMember.id },
                data: {
                  ...updateData,
                  user: {
                    connect: { id: user.id },
                  },
                },
              });

              // Format response
              workspaceData =
                WorkspaceInvitationProcessor.formatWorkspaceResponse(
                  workspace,
                  {
                    role: updatedMember.role,
                    permissions: updatedMember.permissions,
                  }
                );

              // Invalidate workspace cache
              try {
                await cacheService.del(`slug:${workspace.slug}`, {
                  prefix: "workspace",
                });
              } catch (cacheError) {
                console.error(
                  "Failed to invalidate workspace cache:",
                  cacheError
                );
              }
            }
          }
        }
      }

      // Build response
      const userResponse: RegisterUserResponse = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        plan: user.plan,
        verified: user.verified,
      };

      return {
        message: workspaceData
          ? `User created successfully and added to workspace ${workspaceData.name}. Please check your email to verify your account.`
          : "User created successfully. Please check your email to verify your account.",
        user: userResponse,
        workspace: workspaceData,
      };
    } catch (error) {
      throw error;
    }
  }
}
