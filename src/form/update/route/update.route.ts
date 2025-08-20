import express, { Router } from "express";
import { authenticateToken } from "../../../middleware/auth";
import { updateFormController } from "../controller";

const router: Router = express.Router();

router.use(authenticateToken);

router.put("/:id", updateFormController);

export default router;