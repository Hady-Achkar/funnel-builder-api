import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { VerifyService } from './index';
import { getPrisma } from '../../../lib/prisma';

// Mock dependencies
vi.mock('../../../lib/prisma');
vi.mock('jsonwebtoken');

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn()
  }
};

describe('VerifyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as any);
    process.env.JWT_SECRET = 'test-secret';
  });

  it('should verify email successfully with valid token', async () => {
    // Arrange
    const userEmail = 'test@example.com';
    const userPassword = 'hashed-password';
    const timestamp = Date.now() - 1000; // 1 second ago
    
    const tokenData = {
      email: userEmail,
      password: userPassword,
      timestamp
    };
    
    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
    const mockJwtToken = 'generated-jwt-token';

    const mockUser = {
      id: 1,
      email: userEmail,
      password: userPassword,
      verified: false,
      verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({ ...mockUser, verified: true });
    vi.mocked(jwt.sign).mockReturnValue(mockJwtToken);

    // Act
    const result = await VerifyService.verifyEmail(token);

    // Assert
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { verificationToken: token },
      select: {
        id: true,
        email: true,
        password: true,
        verified: true,
        verificationTokenExpiresAt: true,
      },
    });

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        verified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });

    expect(jwt.sign).toHaveBeenCalledWith({ userId: 1 }, 'test-secret', { expiresIn: '180d' });

    expect(result).toEqual({
      message: 'Email verified successfully',
      verified: true,
      token: mockJwtToken,
    });
  });

  it('should throw error for invalid token format', async () => {
    // Arrange
    const invalidToken = 'invalid-base64-token';

    // Act & Assert
    await expect(VerifyService.verifyEmail(invalidToken)).rejects.toThrow('Invalid verification token format');
    
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('should throw error for expired token', async () => {
    // Arrange
    const userEmail = 'test@example.com';
    const userPassword = 'hashed-password';
    const timestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago (expired)
    
    const tokenData = {
      email: userEmail,
      password: userPassword,
      timestamp
    };
    
    const expiredToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');

    // Act & Assert
    await expect(VerifyService.verifyEmail(expiredToken)).rejects.toThrow('Verification token has expired');
    
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('should throw error when user not found', async () => {
    // Arrange
    const userEmail = 'test@example.com';
    const userPassword = 'hashed-password';
    const timestamp = Date.now() - 1000;
    
    const tokenData = {
      email: userEmail,
      password: userPassword,
      timestamp
    };
    
    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

    mockPrisma.user.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(VerifyService.verifyEmail(token)).rejects.toThrow('Invalid verification token');
    
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { verificationToken: token },
      select: {
        id: true,
        email: true,
        password: true,
        verified: true,
        verificationTokenExpiresAt: true,
      },
    });
    
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('should throw error when user is already verified', async () => {
    // Arrange
    const userEmail = 'test@example.com';
    const userPassword = 'hashed-password';
    const timestamp = Date.now() - 1000;
    
    const tokenData = {
      email: userEmail,
      password: userPassword,
      timestamp
    };
    
    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

    const mockUser = {
      id: 1,
      email: userEmail,
      password: userPassword,
      verified: true, // Already verified
      verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    // Act & Assert
    await expect(VerifyService.verifyEmail(token)).rejects.toThrow('Email is already verified');
    
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('should throw error when token data does not match user', async () => {
    // Arrange
    const tokenEmail = 'token@example.com';
    const userEmail = 'user@example.com'; // Different email
    const password = 'hashed-password';
    const timestamp = Date.now() - 1000;
    
    const tokenData = {
      email: tokenEmail,
      password: password,
      timestamp
    };
    
    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');

    const mockUser = {
      id: 1,
      email: userEmail, // Different from token
      password: password,
      verified: false,
      verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    // Act & Assert
    await expect(VerifyService.verifyEmail(token)).rejects.toThrow('Token data does not match user');
    
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});