import express, { Router } from "express";
import { createFormSubmissionRoute } from "./create";
import { getAllFormSubmissionsRoute } from "./getAll";

const router: Router = express.Router();

router.use("/", createFormSubmissionRoute);
router.use("/", getAllFormSubmissionsRoute);

export default router;