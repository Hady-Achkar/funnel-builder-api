import dotenv from 'dotenv';
import { PrismaClient } from './generated/prisma-client';
import { createServer } from './app';
import { redisService } from './services/cache/redis.service';

dotenv.config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('Connected to database');
    
    // Connect to Redis
    try {
      await redisService.connect();
      console.log('Connected to Redis');
    } catch (error) {
      console.warn('Redis connection failed:', error);
      console.log('Continuing without Redis...');
    }

    // Create and start server
    const app = createServer();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  
  try {
    await prisma.$disconnect();
    console.log('Database disconnected');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }

  try {
    await redisService.disconnect();
    console.log('Redis disconnected');
  } catch (error) {
    console.error('Error disconnecting from Redis:', error);
  }

  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

startServer();