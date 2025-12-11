import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { verifyEmailController } from './index';
import { VerifyService } from '../../../services/auth/verify';
// Mock dependencies
vi.mock('../../../services/auth/verify');

describe('verifyEmailController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      query: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    next = vi.fn();
    
    vi.clearAllMocks();
  });

  it('should verify email successfully with valid token and return token', async () => {
    // Arrange
    const mockToken = 'valid-token';
    const mockServiceResponse = {
      message: 'Email verified successfully',
      verified: true,
      token: 'jwt-token'
    };

    req.query = { token: mockToken };
    vi.mocked(VerifyService.verifyEmail).mockResolvedValue(mockServiceResponse);

    // Act
    await verifyEmailController(req as Request, res as Response, next);

    // Assert
    expect(VerifyService.verifyEmail).toHaveBeenCalledWith(mockToken);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Email verified successfully',
      verified: true,
      token: 'jwt-token'
    });
  });

  it('should return 400 error when token is missing', async () => {
    // Arrange
    req.query = {}; // No token provided

    // Act
    await verifyEmailController(req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Verification token is required'
    });
    expect(VerifyService.verifyEmail).not.toHaveBeenCalled();
  });

  it('should call next with error when service throws', async () => {
    // Arrange
    const mockToken = 'invalid-token';
    const mockError = new Error('Invalid verification token');

    req.query = { token: mockToken };
    vi.mocked(VerifyService.verifyEmail).mockRejectedValue(mockError);

    // Act
    await verifyEmailController(req as Request, res as Response, next);

    // Assert
    expect(VerifyService.verifyEmail).toHaveBeenCalledWith(mockToken);
    expect(next).toHaveBeenCalledWith(mockError);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});