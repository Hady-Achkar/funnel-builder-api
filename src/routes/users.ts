import express, { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { UserController } from "../controllers/user.controller";

const router: Router = express.Router();

router.get("/profile", authenticateToken, UserController.getProfile);
router.put("/profile", authenticateToken, UserController.updateProfile);
router.delete("/account", authenticateToken, UserController.deleteAccount);

export default router;
