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
          maximumFunnels: finalLimits.maximumFunnels,
          maximumCustomDomains: finalLimits.maximumCustomDomains,
          maximumSubdomains: finalLimits.maximumSubdomains,
        },
      });

      try {
        await sendVerificationEmail(
          user.email,
          user.firstName,
          verificationToken
        );
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      return {
        message:
          "User created successfully. Please check your email to verify your account.",
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