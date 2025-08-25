import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import { registerRequest, RegisterResponse } from "../types/register.types";
import { PlanLimitsHelper } from "../helpers/plan-limits.helper";

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
        maximumSubdomains
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

      // Calculate final limits using the helper
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
            // Allocate all limits to the personal workspace initially
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
              "EDIT_DOMAINS",
              "DELETE_DOMAINS",
              "CONNECT_DOMAINS",
            ],
          },
        });

        // Create default image folder for the new user
        await tx.imageFolder.create({
          data: {
            name: "Default Folder",
            userId: user.id,
          },
        });

        return user;
      });

      const token = this.generateToken(result.id);

      return {
        message: "User created successfully",
        token,
        user: {
          id: result.id,
          email: result.email,
          username: result.username,
          firstName: result.firstName,
          lastName: result.lastName,
          isAdmin: result.isAdmin || false,
          plan: result.plan,
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

  private static generateToken(userId: number): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT secret not configured");
    }

    return jwt.sign({ userId }, jwtSecret, { expiresIn: "180d" });
  }
}
