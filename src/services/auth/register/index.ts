import { getPrisma } from "../../../lib/prisma";
import {
  RegisterRequest,
  RegisterResponse,
  RegisterUserResponse,
  RegisterWorkspaceResponse,
} from "../../../types/auth/register";
import { TrialPeriodCalculator } from "../../../utils/common-functions/trial-period";
import bcrypt from "bcryptjs";
import {
  generateVerificationToken,
  getVerificationTokenExpiry,
} from "./utils/generate-verification-token";
import { WorkspaceInvitationProcessor } from "./utils/workspace-invitation.utils";
import {
  getVerificationEmail,
  VerificationEmailData,
} from "../../../constants/emails/auth/verification";
import sgMail from "@sendgrid/mail";
import { cacheService } from "../../cache/cache.service";
import { RegistrationSource, UserPlan } from "../../../generated/prisma-client";

export class RegisterService {
  static async register(
    data: RegisterRequest,
    registrationSource: RegistrationSource
  ): Promise<RegisterResponse> {
    try {
      const prisma = getPrisma();

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const verificationToken = generateVerificationToken(data);
      const verificationTokenExpiresAt = getVerificationTokenExpiry();

      // Determine user plan based on registration source
      let userPlan = data.plan || UserPlan.NO_PLAN;
      if (registrationSource === RegistrationSource.WORKSPACE_INVITE) {
        userPlan = UserPlan.WORKSPACE_MEMBER;
      }

      // Set trial dates for all plans except WORKSPACE_MEMBER (default: 1 year)
      let trialStartDate: Date | undefined;
      let trialEndDate: Date | undefined;
      if (userPlan !== UserPlan.WORKSPACE_MEMBER) {
        const trialDates = TrialPeriodCalculator.getTrialDates(
          data.trialPeriod
        );
        trialStartDate = trialDates.trialStartDate;
        trialEndDate = trialDates.trialEndDate;
      }

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
          plan: userPlan,
          registrationSource,
          // Note: referralLinkUsedId will be set after payment is completed
          trialStartDate,
          trialEndDate,
        },
      });

      // Send verification email (non-blocking, don't fail registration if email fails)
      try {
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
          throw new Error("SENDGRID_API_KEY is not configured");
        }
        sgMail.setApiKey(apiKey);

        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        const emailData: VerificationEmailData = {
          firstName: user.firstName,
          verificationUrl,
        };

        const html = getVerificationEmail(emailData);

        const msg = {
          to: user.email,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL,
            name: "Digitalsite",
          },
          subject: "Verify Your Email Address | تأكيد بريدك الإلكتروني",
          html,
        };

        await sgMail.send(msg);
      } catch (error: any) {
        console.error("Failed to send verification email:", error);
        if (error.response && error.response.body) {
          console.error(
            "SendGrid error details:",
            JSON.stringify(error.response.body, null, 2)
          );
        }
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
            const isDirectLink = tokenPayload.type === "workspace_direct_link";

            if (isDirectLink) {
              // For direct links, create a new workspace member
              const newMember = await prisma.workspaceMember.create({
                data: {
                  userId: user.id,
                  workspaceId: workspace.id,
                  role: tokenPayload.role || "EDITOR",
                  permissions: [],
                  status: "ACTIVE",
                  joinedAt: new Date(),
                },
              });

              // Format response
              workspaceData =
                WorkspaceInvitationProcessor.formatWorkspaceResponse(
                  workspace,
                  {
                    role: newMember.role,
                    permissions: newMember.permissions,
                  }
                );
            } else {
              // For email invitations, find and update pending membership
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
              }
            }

            // Invalidate workspace cache
            if (workspaceData) {
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
