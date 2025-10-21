import { Router } from "express";
import { authenticateCronJob } from "../middleware/authenticate-cron-job";
import { ReleaseCommissionsController } from "../controllers/cron/release-commissions";

const router = Router();

router.post(
  "/release-commissions",
  authenticateCronJob,
  ReleaseCommissionsController.handleCronJob
);

export default router;
