import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import cookieParser from "cookie-parser";
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
import { workspacesRouter } from "./workspace/routes";
import insightRoutes from "./routes/insight";
import insightSubmissionRoutes from "./routes/insight-submission";

export function createServer(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }));
  
  // Cookie parsing middleware
  app.use(cookieParser());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
  });

  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per windowMs at full speed
    delayMs: () => 500, // add 500ms delay per request after delayAfter
    validate: { delayMs: false }, // disable deprecation warning
  });

  app.use("/api/", limiter);
  app.use("/api/", speedLimiter);

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

  // Health check endpoint
  app.get("/health", async (req, res) => {
    const healthStatus = {
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      redis: false,
    };

    // Check Redis health
    try {
      healthStatus.redis = await redisService.ping();
    } catch (error) {
      healthStatus.redis = false;
    }

    const statusCode = healthStatus.redis ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  });

  // Root endpoint
  app.get("/", (req, res) => {
    res.json({
      message: "Funnel Builder API",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      endpoints: {
        auth: "/api/auth",
        users: "/api/users",
        funnels: "/api/funnels",
        pages: "/api/pages",
        domains: "/api/domains",
        "domains/create-custom-domain": "/api/domains/create-custom-domain",
        "domains/verify": "/api/domains/verify",
        "domains/dns-instructions": "/api/domains/dns-instructions",
        "domain-funnel/connect": "/api/domain-funnel/connect",
        "domain-funnel/connections": "/api/domain-funnel/connections",
        health: "/health",
        themes: "/api/themes",
        forms: "/api/forms",
        formSubmissions: "/api/form-submissions",
        workspaces: "/api/workspaces",
        insights: "/api/insights",
        insightSubmissions: "/api/insight-submissions",
      },
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
