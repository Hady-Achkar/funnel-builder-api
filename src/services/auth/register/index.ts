import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import { registerRequest, RegisterResponse } from "../../../types/auth/register";
import { PlanLimitsHelper } from "../../../helpers/auth/register";

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
          verified: true,
          isAdmin,
          plan,
          maximumFunnels: finalLimits.maximumFunnels,
          maximumCustomDomains: finalLimits.maximumCustomDomains,
          maximumSubdomains: finalLimits.maximumSubdomains,
        },
      });

      return {
        message:
          "User created successfully.",
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