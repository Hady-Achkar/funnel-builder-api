import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { VerifyService } from "./index";
import { getPrisma } from "../../../lib/prisma";
import { generateToken } from "../utils";

// Mock dependencies
vi.mock("../../../lib/prisma");
vi.mock("jsonwebtoken");
vi.mock("../utils");

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

describe("VerifyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPrisma).mockReturnValue(mockPrisma as any);
    process.env.JWT_SECRET = "test-secret";
  });

  it("should verify email successfully with valid token", async () => {
    // Arrange
    const userEmail = "test@example.com";
    const token = "valid-jwt-token";
    const mockJwtToken = "generated-jwt-token";

    const tokenData = {
      email: userEmail,
    };

    const mockUser = {
      id: 1,
      email: userEmail,
      verified: false,
    };

    vi.mocked(jwt.verify).mockReturnValue(tokenData as any);
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({ ...mockUser, verified: true });
    vi.mocked(generateToken).mockReturnValue(mockJwtToken);

    // Act
    const result = await VerifyService.verifyEmail(token);

    // Assert
    expect(jwt.verify).toHaveBeenCalledWith(token, "test-secret");

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: userEmail },
    });

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        verified: true,
      },
    });

    expect(generateToken).toHaveBeenCalledWith(mockUser);

    expect(result).toEqual({
      message: "Email verified successfully",
      verified: true,
      token: mockJwtToken,
    });
  });

  it("should throw error for invalid token format", async () => {
    // Arrange
    const invalidToken = "invalid-jwt-token";

    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    // Act & Assert
    await expect(VerifyService.verifyEmail(invalidToken)).rejects.toThrow(
      "Invalid verification token"
    );

    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("should throw error for expired token", async () => {
    // Arrange
    const expiredToken = "expired-jwt-token";

    vi.mocked(jwt.verify).mockImplementation(() => {
      const error: any = new Error("jwt expired");
      error.name = "TokenExpiredError";
      throw error;
    });

    // Act & Assert
    await expect(VerifyService.verifyEmail(expiredToken)).rejects.toThrow(
      "Verification token has expired"
    );

    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("should throw error when user not found", async () => {
    // Arrange
    const userEmail = "test@example.com";
    const token = "valid-jwt-token";

    const tokenData = {
      email: userEmail,
    };

    vi.mocked(jwt.verify).mockReturnValue(tokenData as any);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(VerifyService.verifyEmail(token)).rejects.toThrow(
      "User not found"
    );

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: userEmail },
    });

    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("should throw error when user is already verified", async () => {
    // Arrange
    const userEmail = "test@example.com";
    const token = "valid-jwt-token";

    const tokenData = {
      email: userEmail,
    };

    const mockUser = {
      id: 1,
      email: userEmail,
      verified: true, // Already verified
    };

    vi.mocked(jwt.verify).mockReturnValue(tokenData as any);
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    // Act & Assert
    await expect(VerifyService.verifyEmail(token)).rejects.toThrow(
      "Email is already verified"
    );

    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("should throw error when token has no email", async () => {
    // Arrange
    const token = "valid-jwt-token";

    const tokenData = {}; // No email field

    vi.mocked(jwt.verify).mockReturnValue(tokenData as any);

    // Act & Assert
    await expect(VerifyService.verifyEmail(token)).rejects.toThrow(
      "Invalid verification token data"
    );

    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});
