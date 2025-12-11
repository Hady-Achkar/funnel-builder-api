import { Router } from "express";
import { authenticateCronJob } from "../middleware/authenticate-cron-job";
import { ReleaseCommissionsController } from "../controllers/cron/release-commissions";
import { AddonExpirationController } from "../controllers/cron/addon-expiration";

const router = Router();

router.post(
  "/release-commissions",
  authenticateCronJob,
  ReleaseCommissionsController.handleCronJob
);

router.post(
  "/addon-expiration",
  authenticateCronJob,
  AddonExpirationController.run
);

export default router;
