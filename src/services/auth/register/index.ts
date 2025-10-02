import bcrypt from "bcryptjs";
import { getPrisma } from "../../../lib/prisma";
import {
  RegisterRequest,
  RegisterResponse,
} from "../../../types/auth/register";
import { UserWorkspaceAllocations } from "../../../utils/user-workspace-allocations";
import { TrialPeriodCalculator } from "../../../utils/trial-period";
import { sendVerificationEmail } from "../../../helpers/auth/emails/register";
import { generateVerificationToken } from "../utils";
import { WorkspaceInvitationProcessor } from "./utils/workspace-invitation.utils";
import { TokenValidator } from "./utils/token-validator";

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
        trialPeriod,
        workspaceInvitationToken,
      } = userData;

      const prisma = getPrisma();

      // Early token validation if invitation token is provided
      if (workspaceInvitationToken) {
        // Validate token and check email match
        const tokenPayload = await TokenValidator.validateInvitationToken(
          workspaceInvitationToken,
          email
        );

        // Check if pending invitation exists
        await TokenValidator.checkPendingInvitation(
          email,
          tokenPayload.workspaceId,
          prisma
        );
      }

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

      // Get workspace allocation based on plan (no add-ons at registration)
      const maximumWorkspaces = UserWorkspaceAllocations.getBaseAllocation(plan);

      // Calculate trial dates (defaults to 6 years if not specified)
      const { trialStartDate, trialEndDate } = TrialPeriodCalculator.getTrialDates(trialPeriod);
      console.log("Trial dates calculated:", { trialStartDate, trialEndDate, trialPeriod });

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
          maximumWorkspaces,
          trialStartDate,
          trialEndDate,
          // Partner fields will use database defaults:
          // partnerLevel: 1
          // totalSales: 0
          // commissionPercentage: 5
        },
      });

      try {
        await sendVerificationEmail(email, firstName, verificationToken);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      // Process invitation token if provided (already validated)
      let workspaceData = undefined;
      if (workspaceInvitationToken) {
        workspaceData =
          await WorkspaceInvitationProcessor.processWorkspaceInvitation(
            user.id,
            email,
            workspaceInvitationToken,
            prisma
          );
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
