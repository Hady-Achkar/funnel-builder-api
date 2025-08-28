import express, { Router } from "express";
import { createCustomDomainRouter } from "./create-custom-domain";
import { createSubdomainRouter } from "./create-subdomain";
import { deleteDomainRouter } from "./delete";
import { verifyDomainRouter } from "./verify";
import { getDNSInstructionsRouter } from "./get-dns-instructions";

const router: Router = express.Router();

router.use("/create-custom-domain", createCustomDomainRouter);
router.use("/create-subdomain", createSubdomainRouter);
router.use("/", deleteDomainRouter);
router.use("/verify", verifyDomainRouter);
router.use("/dns-instructions", getDNSInstructionsRouter);

export default router;
