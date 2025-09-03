import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import { registerRequest, RegisterResponse } from "../../../types/auth/register";
import { PlanLimitsHelper } from "../../../helpers/auth/register";
import { sendVerificationEmail } from "../../../helpers/auth/emails/register";

export class RegisterService {
  static async register(userData: unknown): Promise<RegisterResponse> {
    try {
      const validatedData = registerRequest.parse(userData);

      const {
        email,
        username,
        firstName,
        lastName,
        password,
        isAdmin,
        plan,
        maximumFunnels,
        maximumCustomDomains,
        maximumSubdomains,
      } = validatedData;

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

      const tokenData = {
        email,
        password: hashedPassword,
        timestamp: Date.now(),
      };
      const verificationToken = Buffer.from(JSON.stringify(tokenData)).toString(
        "base64"
      );
      const verificationTokenExpiresAt = new Date();
      verificationTokenExpiresAt.setHours(
        verificationTokenExpiresAt.getHours() + 24
      );

      const finalLimits = PlanLimitsHelper.calculateFinalLimits(plan, {
        maximumFunnels,
        maximumCustomDomains,
        maximumSubdomains,
      });

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
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
            maximumFunnels: finalLimits.maximumFunnels,
            maximumCustomDomains: finalLimits.maximumCustomDomains,
            maximumSubdomains: finalLimits.maximumSubdomains,
          },
        });

        const workspace = await tx.workspace.create({
          data: {
            name: "Personal Workspace",
            slug: `${username}-personal`,
            ownerId: user.id,
            description: "Your personal workspace for creating funnels",
            allocatedFunnels: finalLimits.maximumFunnels,
            allocatedCustomDomains: finalLimits.maximumCustomDomains,
            allocatedSubdomains: finalLimits.maximumSubdomains,
          },
        });

        await tx.workspaceMember.create({
          data: {
            userId: user.id,
            workspaceId: workspace.id,
            role: "OWNER",
            permissions: [
              "MANAGE_WORKSPACE",
              "MANAGE_MEMBERS",
              "CREATE_FUNNELS",
              "EDIT_FUNNELS",
              "EDIT_PAGES",
              "DELETE_FUNNELS",
              "VIEW_ANALYTICS",
              "MANAGE_DOMAINS",
              "CREATE_DOMAINS",
              "DELETE_DOMAINS",
              "CONNECT_DOMAINS",
            ],
          },
        });

        await tx.imageFolder.create({
          data: {
            name: "Default Folder",
            userId: user.id,
          },
        });

        return user;
      });

      try {
        await sendVerificationEmail(
          result.email,
          result.firstName,
          verificationToken
        );
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      return {
        message:
          "User created successfully. Please check your email to verify your account.",
        user: {
          id: result.id,
          email: result.email,
          username: result.username,
          firstName: result.firstName,
          lastName: result.lastName,
          isAdmin: result.isAdmin || false,
          plan: result.plan,
          verified: result.verified,
        },
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        throw firstError;
      }
      throw error;
    }
  }
}