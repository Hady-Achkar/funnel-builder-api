import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { redisService } from './services/cache/redis.service';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import funnelRoutes from './routes/funnels';
import pageRoutes from './routes/pages';
import domainRoutes from './routes/domains';

export function createServer() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });

  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per windowMs at full speed
    delayMs: () => 500, // add 500ms delay per request after delayAfter
    validate: { delayMs: false } // disable deprecation warning
  });

  app.use('/api/', limiter);
  app.use('/api/', speedLimiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/funnels', funnelRoutes);
  app.use('/api/pages', pageRoutes);
  app.use('/api/domains', domainRoutes);

  // Health check endpoint
  app.get('/health', async (req, res) => {
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      redis: false
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
  app.get('/', (req, res) => {
    res.json({
      message: 'Funnel Builder API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        funnels: '/api/funnels',
        pages: '/api/pages',
        domains: '/api/domains',
        health: '/health'
      }
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    });
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Global error handler:', err);

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: isDevelopment ? err.message : 'Something went wrong',
      ...(isDevelopment && { stack: err.stack }),
      timestamp: new Date().toISOString()
    });
  });

  return app;
}