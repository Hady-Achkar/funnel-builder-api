import express, { Router } from "express";
import { createInsightSubmissionRoute } from "./create";
import { getAllInsightSubmissionsRoute } from "./getAll";

const router: Router = express.Router();

router.use("/", createInsightSubmissionRoute);
router.use("/", getAllInsightSubmissionsRoute);

export default router;