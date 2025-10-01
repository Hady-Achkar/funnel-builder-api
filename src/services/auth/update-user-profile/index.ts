import { getPrisma } from "../../../lib/prisma";
import {
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
} from "../../../types/auth/update-user-profile";
import { generateToken } from "../utils";

export class UpdateUserProfileService {
  static async updateUserProfile(
    userId: number,
    data: UpdateUserProfileRequest
  ): Promise<UpdateUserProfileResponse> {
    try {
      if ("email" in data) {
        throw new Error("Email updates are not allowed");
      }

      // Update user and fetch all fields needed for token generation
      const user = await getPrisma().user.update({
        where: { id: userId },
        data,
      });

      // Generate new JWT token with updated user data
      const token = generateToken(user);

      return { token };
    } catch (error) {
      throw error;
    }
  }
}
