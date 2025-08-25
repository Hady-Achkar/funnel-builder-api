import { getPrisma } from "../../../lib/prisma";

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
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
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  static async updateUserProfile(
    userId: number,
    data: { firstName?: string; lastName?: string; email?: string }
  ): Promise<UserProfile> {
    const user = await getPrisma().user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}