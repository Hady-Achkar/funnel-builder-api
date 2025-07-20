import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService, setPrismaClient } from '../../services/auth.service';
import { TestHelpers, testPrisma } from '../helpers';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  beforeEach(async () => {
    // Set test Prisma client for auth service
    setPrismaClient(testPrisma);
    
    // Clean up before each test
    await testPrisma.user.deleteMany();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      const result = await AuthService.register(userData);

      expect(result).toHaveProperty('message', 'User created successfully');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.user).not.toHaveProperty('password');

      // Verify user exists in database
      const dbUser = await testPrisma.user.findUnique({
        where: { email: userData.email }
      });
      expect(dbUser).toBeTruthy();
      expect(dbUser!.email).toBe(userData.email);

      // Verify password is hashed
      const isPasswordValid = await bcrypt.compare(userData.password, dbUser!.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      // Create user first
      await AuthService.register(userData);

      // Try to register again
      await expect(AuthService.register(userData)).rejects.toThrow('User already exists');
    });

    it('should register user without name', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await AuthService.register(userData);

      expect(result.user.name).toBeNull();
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      // Register user first
      await AuthService.register(userData);

      // Login
      const result = await AuthService.login({
        email: userData.email,
        password: userData.password
      });

      expect(result).toHaveProperty('message', 'Login successful');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(userData.email);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw error for non-existent user', async () => {
      await expect(AuthService.login({
        email: 'nonexistent@example.com',
        password: 'password123'
      })).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for incorrect password', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      // Register user first
      await AuthService.register(userData);

      // Try to login with wrong password
      await expect(AuthService.login({
        email: userData.email,
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('generateToken', () => {
    it('should throw error if JWT_SECRET is not configured', async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      await expect(AuthService.register(userData)).rejects.toThrow('JWT secret not configured');

      // Restore original secret
      process.env.JWT_SECRET = originalSecret;
    });
  });
});