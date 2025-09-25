import bcrypt from "bcryptjs";
import { getPrisma } from "../../../lib/prisma";
import {
  RegisterRequest,
  RegisterResponse,
} from "../../../types/auth/register";
import { PlanLimitsHelper } from "../../../helpers/auth/register";
import { sendVerificationEmail } from "../../../helpers/auth/emails/register";
import { generateVerificationToken } from "../utils";
import { WorkspaceInvitationProcessor } from "./utils/workspace-invitation.utils";

export class RegisterService {
  static async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const {
        email,
        username,
        firstName,
        lastName,
        password,
        isAdmin,
        plan,
        invitationToken,
      } = userData;

      const prisma = getPrisma();

      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUserByEmail) {
        throw new Error("User with this email already exists");
      }

      const existingUserByUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUserByUsername) {
        throw new Error("Username is already taken");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const finalLimits = PlanLimitsHelper.calculateFinalLimits(plan, {});

      const verificationToken = generateVerificationToken(userData);
      const verificationTokenExpiresAt = new Date();
      verificationTokenExpiresAt.setHours(
        verificationTokenExpiresAt.getHours() + 24
      );

      const user = await prisma.user.create({
        data: {
          email,
          username,
          firstName,
          lastName,
          password: hashedPassword,
          verified: false,
          verificationToken,
          verificationTokenExpiresAt,
          isAdmin,
          plan,
          maximumWorkspaces: finalLimits.maximumWorkspaces,
        },
      });

      try {
        await sendVerificationEmail(email, firstName, verificationToken);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      // Process invitation token if provided
      let workspaceData = undefined;
      if (invitationToken) {
        try {
          workspaceData =
            await WorkspaceInvitationProcessor.processWorkspaceInvitation(
              user.id,
              email,
              invitationToken,
              prisma
            );
        } catch (invitationError) {
          console.error("Failed to process invitation token:", invitationError);
          // Continue with registration even if invitation fails
        }
      }

      return {
        message: workspaceData
          ? `User created successfully and added to workspace ${workspaceData.name}. Please check your email to verify your account.`
          : "User created successfully. Please check your email to verify your account.",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin || false,
          plan: user.plan,
          verified: user.verified,
        },
        workspace: workspaceData,
      };
    } catch (error) {
      throw error;
    }
  }
}
