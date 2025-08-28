import express, { Router } from "express";
import { createFormRoute } from "./create";
import { updateFormRoute } from "./update";
import { deleteFormRoute } from "./delete";
import { webhookRoute } from "./webhook/route";

const router: Router = express.Router();

router.use("/", createFormRoute);

router.use("/", updateFormRoute);

router.use("/", deleteFormRoute);

router.use("/webhook", webhookRoute);

export default router;