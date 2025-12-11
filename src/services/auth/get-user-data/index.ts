import { getPrisma } from "../../../lib/prisma";
import { GetUserDataResponse } from "../../../types/auth/get-user-data";

export class GetUserDataService {
  static async getUserData(
    userId: number
  ): Promise<GetUserDataResponse | null> {
    try {
      const user = await getPrisma().user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isAdmin: true,
          plan: true,
          balance: true,
          trialStartDate: true,
          trialEndDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      throw error;
    }
  }
}
