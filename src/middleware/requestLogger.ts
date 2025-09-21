import morgan from "morgan";
import { Request, Response } from "express";
import { AuthRequest } from "./auth";

// Custom Morgan tokens
morgan.token("user-id", (req: Request) => {
  return (req as AuthRequest).userId?.toString() || "-";
});

morgan.token("response-time-colored", (req: Request, res: Response) => {
  const time = res.getHeader("X-Response-Time");
  if (typeof time === "string") {
    const ms = parseFloat(time);
    if (ms < 100) return `\x1b[32m${ms.toFixed(3)}ms\x1b[0m`; // Green
    if (ms < 500) return `\x1b[33m${ms.toFixed(3)}ms\x1b[0m`; // Yellow
    return `\x1b[31m${ms.toFixed(3)}ms\x1b[0m`; // Red
  }
  return "-";
});

morgan.token("status-colored", (req: Request, res: Response) => {
  const status = res.statusCode;
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`; // Red
  if (status >= 400) return `\x1b[33m${status}\x1b[0m`; // Yellow
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`; // Cyan
  if (status >= 200) return `\x1b[32m${status}\x1b[0m`; // Green
  return `${status}`;
});

morgan.token("method-colored", (req: Request) => {
  const method = req.method;
  const colors: { [key: string]: string } = {
    GET: "\x1b[32m",    // Green
    POST: "\x1b[33m",   // Yellow
    PUT: "\x1b[34m",    // Blue
    DELETE: "\x1b[31m", // Red
    PATCH: "\x1b[35m",  // Magenta
  };
  const color = colors[method] || "\x1b[37m"; // Default to white
  return `${color}${method}\x1b[0m`;
});

// Custom format for development
export const devFormat = ":method-colored :url :status-colored :response-time ms - :res[content-length] [User: :user-id]";

// Custom format for production (JSON)
export const productionFormat = (tokens: any, req: Request, res: Response) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: parseInt(tokens.status(req, res) || "0"),
    responseTime: parseFloat(tokens["response-time"](req, res) || "0"),
    contentLength: tokens.res(req, res, "content-length"),
    userAgent: tokens["user-agent"](req, res),
    ip: tokens["remote-addr"](req, res),
    userId: (req as AuthRequest).userId || null,
    referrer: tokens.referrer(req, res) || null,
  });
};

// Export configured morgan middleware
export const requestLogger = () => {
  if (process.env.NODE_ENV === "production") {
    return morgan(productionFormat, {
      skip: (req) => req.url === "/health",
    });
  } else {
    return morgan(devFormat, {
      skip: (req) => req.url === "/health",
    });
  }
};