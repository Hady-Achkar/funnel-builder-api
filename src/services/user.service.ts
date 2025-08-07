import { PrismaClient, User } from "../generated/prisma-client";

// Allow prisma client to be injected for testing
let prisma: PrismaClient | null = null;

// Function to get Prisma client (lazy initialization)
const getPrisma = (): PrismaClient => {
  if (!prisma) {
    // Only create default client if we're not in test environment
    if (process.env.NODE_ENV !== "test") {
      prisma = new PrismaClient();
    } else {
      throw new Error(
        "PrismaClient not set for test environment. Call setPrismaClient() first."
      );
    }
  }
  return prisma;
};

// Function to set Prisma client for testing
export const setPrismaClient = (client: PrismaClient) => {
  prisma = client;
};

export interface UserProfile {
  id: number;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  static async getUserProfile(userId: number): Promise<UserProfile | null> {
    const user = await getPrisma().user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  static async updateUserProfile(
    userId: number,
    data: { name?: string; email?: string }
  ): Promise<UserProfile> {
    const user = await getPrisma().user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  static async deleteUser(userId: number): Promise<void> {
    await getPrisma().user.delete({
      where: { id: userId },
    });
  }
}
