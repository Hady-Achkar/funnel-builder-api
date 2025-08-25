import { Response } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { UserService } from "../service/user.service";

export class UserController {
  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const user = await UserService.getUserProfile(userId);
      
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      
      res.json({ user });
    } catch (error: any) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { firstName, lastName, email } = req.body;

      const user = await UserService.updateUserProfile(userId, { firstName, lastName, email });
      res.json({ user });
    } catch (error: any) {
      console.error("Update profile error:", error);

      if (error.code === "P2002") {
        res.status(400).json({ error: "Email already exists" });
        return;
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      // TODO: Implement user account deletion
      res.status(501).json({ error: "Account deletion not implemented yet" });
    } catch (error: any) {
      console.error("Delete account error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}