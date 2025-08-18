import express, { Router } from "express";
import { authenticateToken } from "../../middleware/auth";
import {
  createFunnel,
  getUserFunnels,
  getFunnelById,
  updateFunnel,
  deleteFunnel,
  createFunnelFromTemplateController,
} from "../controllers";

const router: Router = express.Router();

router.use(authenticateToken);

router.post("/", createFunnel);
router.post("/from-template/:templateId", createFunnelFromTemplateController);
router.get("/", getUserFunnels);
router.get("/:id", getFunnelById);
router.put("/:id", updateFunnel);
router.delete("/:id", deleteFunnel);

export default router;
