import { getPrisma } from "../../../lib/prisma";
import { GetFreshUserDataResponse } from "../../../types/auth/get-fresh-user-data";

export class GetFreshUserDataService {
  static async getFreshUserData(
    userId: number
  ): Promise<GetFreshUserDataResponse | null> {
    try {
      const user = await getPrisma().user.findUnique({
        where: { id: userId },
        select: {
          plan: true,
          registrationSource: true,
          registrationToken: true,
          balance: true,
        },
      });

      return user;
    } catch (error) {
      throw error;
    }
  }
}
