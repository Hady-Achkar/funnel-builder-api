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
import payoutRoutes from "./routes/payout";
import siteRoutes from "./routes/site";
import sessionRoutes from "./routes/session";
import balanceRoutes from "./routes/balance";

export function createServer(): Express {
  const app = express();

  // Trust proxy settings for Azure Container Apps
  app.set("trust proxy", true);

  // Request logging middleware
  app.use(requestLogger());

  // Security middleware
  app.use(helmet());

  // CORS Configuration
  const allowedOrigins = [
    process.env.FRONTEND_URL,                      // Main frontend
    /^https:\/\/.*\.digitalsite\.io$/,             // All digitalsite.io subdomains (workspaces, funnels)
    /^https:\/\/digitalsite\.io$/,                 // Main digitalsite.io domain
    /^https:\/\/.*\.digitalsite\.app$/,            // All digitalsite.app subdomains (custom domains)
    /^https:\/\/digitalsite\.app$/,                // Main digitalsite.app domain
    /^https:\/\/.*\.digitalsite\.com$/,            // All digitalsite.com subdomains
    /^https:\/\/digitalsite\.com$/,                // Main digitalsite.com domain
    /^https:\/\/.*\.azurecontainerapps\.io$/,      // Azure Container Apps
    /^https:\/\/.*\.azurefd\.net$/,                // Azure Front Door
    /^https:\/\/.*\.vercel\.app$/,                 // Vercel deployments
    "http://localhost:3000",                       // Development frontend
    "http://localhost:3001",                       // Alternative dev port
    "http://localhost:4444",                       // Development API
  ].filter(Boolean); // Remove undefined values

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        // Check if origin matches allowed patterns
        const isAllowed = allowedOrigins.some((allowed) => {
          if (typeof allowed === "string") {
            return origin === allowed;
          }
          if (allowed instanceof RegExp) {
            return allowed.test(origin);
          }
          return false;
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true, // Required for cookies and Authorization headers
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      exposedHeaders: ["Set-Cookie"],
      maxAge: 86400, // 24 hours - cache preflight requests
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
  app.use("/api/payout", payoutRoutes);
  app.use("/api/sites", siteRoutes);
  app.use("/api/sessions", sessionRoutes);
  app.use("/api/balance", balanceRoutes);

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
