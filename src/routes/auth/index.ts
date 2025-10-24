import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { RegisterController } from "../../controllers/auth/register";
import { LoginController } from "../../controllers/auth/login";
import { UpdateUserProfileController } from "../../controllers/auth/update-user-profile";
import { GetUserDataController } from "../../controllers/auth/get-user-data";
import { GetFreshUserDataController } from "../../controllers/auth/get-fresh-user-data";
import { verifyEmailController } from "../../controllers/auth/verify";
import { forgotPasswordController } from "../../controllers/auth/forgot-password";
import { resetPasswordController } from "../../controllers/auth/reset-password";
import { LogoutController } from "../../controllers/auth/logout";

const router: Router = express.Router();

// Auth routes
router.post("/register", RegisterController.register);
router.post("/login", LoginController.login);
router.post("/verify", verifyEmailController);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);
router.post("/logout", LogoutController.logout);

// User profile routes (require authentication)
router.get("/user/profile", authenticateToken, GetUserDataController.getUserData);
router.get("/user/fresh-data", authenticateToken, GetFreshUserDataController.getFreshUserData);
router.put("/user/profile", authenticateToken, UpdateUserProfileController.updateUserProfile);

export default router;