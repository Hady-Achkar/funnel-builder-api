import express, { Router } from "express";
import { createCustomDomainRouter } from "./create-custom-domain";
import { verifyDomainRouter } from "./verify";
import { getDNSInstructionsRouter } from "./get-dns-instructions";

const router: Router = express.Router();

// Domain creation routes
router.use("/create-custom-domain", createCustomDomainRouter);

// Domain verification routes
router.use("/verify", verifyDomainRouter);

// DNS instructions routes
router.use("/dns-instructions", getDNSInstructionsRouter);

// TODO: Add other domain routes here as they are implemented:
// router.use("/create-subdomain", createSubdomainRouter);
// router.use("/delete", deleteDomainRouter);
// router.use("/link", linkDomainRouter);
// etc.

export default router;