import { PrismaClient } from '../generated/prisma-client';

// Allow prisma client to be injected for testing
let prisma = new PrismaClient();

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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;
  }

  static async updateUserProfile(userId: number, data: { name?: string; email?: string }): Promise<UserProfile> {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;
  }

  static async deleteUser(userId: number): Promise<void> {
    await prisma.user.delete({
      where: { id: userId }
    });
  }
}