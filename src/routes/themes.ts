import express, { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { createTheme, updateTheme } from "../controllers/theme";

const router: Router = express.Router();

router.use(authenticateToken);

router.post("/", createTheme);
router.put("/:id", updateTheme);

export default router;
