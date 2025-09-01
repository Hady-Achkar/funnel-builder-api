import express, { Router } from "express";
import { connectRouter } from "./connect";
import { getConnectionsRouter } from "./get-connections";

const router: Router = express.Router();

router.use("/connect", connectRouter);
router.use("/connections", getConnectionsRouter);

export default router;