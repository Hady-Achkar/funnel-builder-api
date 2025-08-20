import express, { Router } from "express";
import { createFormRoute } from "./create";
import { updateFormRoute } from "./update";
import { deleteFormRoute } from "./delete";

const router: Router = express.Router();

router.use("/", createFormRoute);

router.use("/", updateFormRoute);

router.use("/", deleteFormRoute);

export default router;