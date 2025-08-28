import express, { Router } from "express";
import { createInsightRoute } from "./create";
import { deleteInsightRoute } from "./delete";
import { updateInsightRoute } from "./update";

const router: Router = express.Router();

router.use("/", createInsightRoute);
router.use("/", deleteInsightRoute);
router.use("/", updateInsightRoute);

export default router;