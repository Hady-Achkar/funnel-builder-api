import express, { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createFunnel,
  getUserFunnels,
  getFunnelById,
  updateFunnel,
  deleteFunnel,
} from "../controllers/funnel";

const router: Router = express.Router();

router.use(authenticateToken);

router.post("/", createFunnel);
router.get("/", getUserFunnels);
router.get("/:id", getFunnelById);
router.put("/:id", updateFunnel);
router.delete("/:id", deleteFunnel);

export default router;
