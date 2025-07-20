import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '../generated/prisma-client';
import { redisService } from '../services/cache/redis.service';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Test database instance
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://localhost:5432/funnel_builder_test'
    }
  }
});

// Setup before all tests
beforeAll(async () => {
  // Reset test database
  try {
    // Drop all data from test database
    await testPrisma.funnelDomain.deleteMany();
    await testPrisma.page.deleteMany();
    await testPrisma.domain.deleteMany();
    await testPrisma.funnel.deleteMany();
    await testPrisma.user.deleteMany();
    console.log('Test database cleared');
  } catch (error) {
    console.warn('Database reset error:', error);
  }

  // Connect to Redis for testing
  try {
    await redisService.connect();
  } catch (error) {
    console.warn('Redis not available for testing:', error);
  }
});

// Cleanup after all tests
afterAll(async () => {
  await testPrisma.$disconnect();
  
  try {
    await redisService.disconnect();
  } catch (error) {
    console.warn('Redis cleanup error:', error);
  }
});

// Clean up before each test
beforeEach(async () => {
  // Clear Redis test data
  try {
    await redisService.flush();
  } catch (error) {
    console.warn('Redis flush error:', error);
  }
});

// Clean up after each test
afterEach(async () => {
  // Clean up database in proper order due to foreign key constraints
  try {
    await testPrisma.funnelDomain.deleteMany();
    await testPrisma.page.deleteMany();
    await testPrisma.domain.deleteMany();
    await testPrisma.funnel.deleteMany();
    await testPrisma.user.deleteMany();
  } catch (error) {
    console.warn('Database cleanup error:', error);
  }
});