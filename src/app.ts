import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import cookieParser from "cookie-parser";
import { requestLogger } from "./middleware/requestLogger";
import { redisService } from "./services/cache/redis.service";
import authRoutes from "./routes/auth";
import funnelRoutes from "./routes/funnel";
import pageRoutes from "./routes/page";
import domainRoutes from "./routes/domain";
import domainFunnelRoutes from "./routes/domain-funnel";
import themeRoutes from "./routes/theme";
import imageFolderRoutes from "./routes/image-folder";
import templateRoutes from "./routes/template";
import imageRoutes from "./routes/image";
import formRoutes from "./routes/form";
import formSubmissionRoutes from "./routes/form-submission";
import funnelSettingsRoutes from "./routes/funnel-settings";
import workspacesRouter from "./routes/workspace";
import insightRoutes from "./routes/insight";
import insightSubmissionRoutes from "./routes/insight-submission";
import affiliateRoutes from "./routes/affiliate";
import paymentRoutes from "./routes/payment";
import subscriptionRoutes from "./routes/subscription";
import cronRoutes from "./routes/cron";

export function createServer(): Express {
  const app = express();

  // Trust proxy settings for Azure Container Apps
  app.set("trust proxy", true);

  // Request logging middleware
  app.use(requestLogger());

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    })
  );

  // Cookie parsing middleware
  app.use(cookieParser());

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/funnels", funnelRoutes);
  app.use("/api/pages", pageRoutes);
  app.use("/api/domains", domainRoutes);
  app.use("/api/domain-funnel", domainFunnelRoutes);
  app.use("/api/themes", themeRoutes);
  app.use("/api/image-folders", imageFolderRoutes);
  app.use("/api/templates", templateRoutes);
  app.use("/api/images", imageRoutes);
  app.use("/api/forms", formRoutes);
  app.use("/api/form-submissions", formSubmissionRoutes);
  app.use("/api/funnel-settings", funnelSettingsRoutes);
  app.use("/api/workspaces", workspacesRouter);
  app.use("/api/insights", insightRoutes);
  app.use("/api/insight-submissions", insightSubmissionRoutes);
  app.use("/api/affiliate", affiliateRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/api/subscription", subscriptionRoutes);
  app.use("/api/cron", cronRoutes);

  // Health check endpoint
  app.get("/health", async (_req, res) => {
    const healthStatus = {
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      redis: await redisService.ping(),
    };

    res.status(200).json(healthStatus);
  });

  // Root endpoint
  app.get("/", (_req, res) => {
    res.json({
      message: "DS API is running",
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({
      error: "Not Found",
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
    });
  });

  // Global error handler
  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error("Global error handler:", err);

      // Don't leak error details in production
      const isDevelopment = process.env.NODE_ENV === "development";

      // Get status code from error or default to 500
      const status = err.status || 500;

      // Build error response
      const errorResponse: any = {
        error: err.message || "Internal Server Error",
      };

      // Add validation errors if present
      if (err.errors && status === 400) {
        errorResponse.errors = err.errors;
      }

      // Add stack trace in development
      if (isDevelopment && err.stack) {
        errorResponse.stack = err.stack;
      }

      res.status(status).json(errorResponse);
    }
  );

  return app;
}
