import express, { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { updateTheme } from "../controllers/theme";

const router: Router = express.Router();

router.use(authenticateToken);

router.put("/:id", updateTheme);

export default router;
