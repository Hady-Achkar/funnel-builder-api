import express from "express";
import { LogoutController } from "../controller/logout.controller";

const router = express.Router();

router.post("/logout", LogoutController.logout);

export default router;