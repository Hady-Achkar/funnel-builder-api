import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import { RegisterController } from "../../controllers/auth/register";
import { LoginController } from "../../controllers/auth/login";
import { UserController } from "../../controllers/auth/user";
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
router.get("/user/profile", authenticateToken, UserController.getProfile);
router.put("/user/profile", authenticateToken, UserController.updateProfile);
router.delete("/user/account", authenticateToken, UserController.deleteAccount);

export default router;