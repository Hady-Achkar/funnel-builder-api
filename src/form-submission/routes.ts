import express, { Router } from "express";
import { createFormSubmissionRoute } from "./create";

const router: Router = express.Router();

router.use("/", createFormSubmissionRoute);

export default router;