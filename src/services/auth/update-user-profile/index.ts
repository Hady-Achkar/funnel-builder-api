import { getPrisma } from "../../../lib/prisma";
import {
  UserProfile,
  UpdateUserProfileRequest,
} from "../../../types/auth/update-user-profile";

export class UpdateUserProfileService {
  static async updateUserProfile(
    userId: number,
    data: UpdateUserProfileRequest
  ): Promise<UserProfile> {
    try {
      if ("email" in data) {
        throw new Error("Email updates are not allowed");
      }
      const user = await getPrisma().user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
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
