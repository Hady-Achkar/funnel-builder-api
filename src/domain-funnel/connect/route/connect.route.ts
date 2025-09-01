import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { ConnectController } from "../controller";

const router: Router = express.Router();

router.post("/", authenticateToken, ConnectController.connect);

export default router;