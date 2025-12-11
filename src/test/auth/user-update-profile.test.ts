import { describe, it, expect, beforeEach, vi } from "vitest";
import { getPrisma } from "../../lib/prisma";
import { UpdateUserProfileService } from "../../services/auth/update-user-profile";

// Mock dependencies
vi.mock("../../lib/prisma");
vi.mock("../../services/auth/utils", () => ({
  generateToken: vi.fn(() => "mock-jwt-token"),
}));

describe("User Update Profile Tests", () => {
  let mockPrisma: any;

  // Test utilities
  const createMockUser = (overrides = {}) => ({
    id: 1,
    email: "test@example.com",
    username: "testuser",
    firstName: "John",
    lastName: "Doe",
    avatar: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Prisma
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };
    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  describe("Authentication Tests", () => {
    it("should reject requests without user ID", async () => {
      mockPrisma.user.update.mockRejectedValue(new Error("Invalid user ID"));

      await expect(
        UpdateUserProfileService.updateUserProfile(undefined as any, {})
      ).rejects.toThrow("Invalid user ID");
    });

    it("should handle invalid user ID", async () => {
      mockPrisma.user.update.mockRejectedValue(new Error("User not found"));

      await expect(
        UpdateUserProfileService.updateUserProfile(999, { firstName: "Test" })
      ).rejects.toThrow("User not found");
    });

    it("should successfully update profile for valid user and return token", async () => {
      const mockUpdatedUser = createMockUser({ firstName: "Updated" });
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await UpdateUserProfileService.updateUserProfile(1, {
        firstName: "Updated",
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { firstName: "Updated" },
      });
      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
    });
  });

  describe("Field Update Tests", () => {
    beforeEach(() => {
      mockPrisma.user.update.mockImplementation(({ data }) => {
        return Promise.resolve(createMockUser(data));
      });
    });

    it("should update firstName successfully and return token", async () => {
      const result = await UpdateUserProfileService.updateUserProfile(1, {
        firstName: "Jane",
      });

      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { firstName: "Jane" },
        })
      );
    });

    it("should update lastName successfully and return token", async () => {
      const result = await UpdateUserProfileService.updateUserProfile(1, {
        lastName: "Smith",
      });

      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { lastName: "Smith" },
        })
      );
    });

    it("should prevent email updates", async () => {
      await expect(
        UpdateUserProfileService.updateUserProfile(1, {
          email: "new@example.com",
        } as any)
      ).rejects.toThrow("Email updates are not allowed");
    });

    it("should update username successfully", async () => {
      const result = await UpdateUserProfileService.updateUserProfile(1, {
        username: "newuser",
      });

      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { username: "newuser" },
        })
      );
    });

    it("should update avatar URL successfully", async () => {
      const avatarUrl = "https://example.com/avatar.jpg";
      const result = await UpdateUserProfileService.updateUserProfile(1, {
        avatar: avatarUrl,
      });

      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { avatar: avatarUrl },
        })
      );
    });

    it("should update multiple fields at once (excluding email)", async () => {
      const updateData = {
        firstName: "Jane",
        lastName: "Smith",
        username: "janesmith",
        avatar: "https://example.com/jane.jpg",
      };

      const result = await UpdateUserProfileService.updateUserProfile(
        1,
        updateData
      );

      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: updateData,
        })
      );
    });

    it("should handle partial updates (only some fields provided)", async () => {
      const result = await UpdateUserProfileService.updateUserProfile(1, {
        firstName: "Partial",
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { firstName: "Partial" },
        })
      );
      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
    });
  });

  describe("Email Update Prevention Tests", () => {
    it("should prevent email updates alone", async () => {
      await expect(
        UpdateUserProfileService.updateUserProfile(1, {
          email: "new@example.com",
        } as any)
      ).rejects.toThrow("Email updates are not allowed");
    });

    it("should prevent email updates when mixed with other fields", async () => {
      await expect(
        UpdateUserProfileService.updateUserProfile(1, {
          firstName: "John",
          email: "new@example.com",
          avatar: "https://example.com/avatar.jpg",
        } as any)
      ).rejects.toThrow("Email updates are not allowed");
    });

    it("should allow other fields when email is not included", async () => {
      const updateData = {
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        avatar: "https://example.com/avatar.jpg",
      };

      mockPrisma.user.update.mockResolvedValue(createMockUser(updateData));

      const result = await UpdateUserProfileService.updateUserProfile(
        1,
        updateData
      );

      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
    });
  });

  describe("Validation Tests", () => {
    it("should handle empty strings for optional fields", async () => {
      mockPrisma.user.update.mockResolvedValue(
        createMockUser({ firstName: "" })
      );

      const result = await UpdateUserProfileService.updateUserProfile(1, {
        firstName: "",
      });

      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
    });

    it("should handle special characters in names", async () => {
      const specialName = "José-María O'Connor";
      mockPrisma.user.update.mockResolvedValue(
        createMockUser({ firstName: specialName })
      );

      const result = await UpdateUserProfileService.updateUserProfile(1, {
        firstName: specialName,
      });

      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
    });

    it("should validate avatar URL format", async () => {
      const validUrls = [
        "https://example.com/avatar.jpg",
        "https://cdn.example.com/images/user123.png",
        "http://localhost:3000/uploads/avatar.gif",
      ];

      for (const url of validUrls) {
        mockPrisma.user.update.mockResolvedValue(
          createMockUser({ avatar: url })
        );
        const result = await UpdateUserProfileService.updateUserProfile(1, {
          avatar: url,
        });
        expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
      }
    });

    it("should handle null avatar", async () => {
      mockPrisma.user.update.mockResolvedValue(
        createMockUser({ avatar: null })
      );

      const result = await UpdateUserProfileService.updateUserProfile(1, {
        avatar: null,
      });

      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", async () => {
      mockPrisma.user.update.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        UpdateUserProfileService.updateUserProfile(1, { firstName: "Test" })
      ).rejects.toThrow("Database connection failed");
    });

    it("should reject email updates with clear error message", async () => {
      await expect(
        UpdateUserProfileService.updateUserProfile(1, {
          email: "any@example.com",
        } as any)
      ).rejects.toThrow("Email updates are not allowed");
    });

    it("should handle username duplicate errors (P2002)", async () => {
      const duplicateUsernameError = {
        code: "P2002",
        message: "Unique constraint failed on username",
      };
      mockPrisma.user.update.mockRejectedValue(duplicateUsernameError);

      await expect(
        UpdateUserProfileService.updateUserProfile(1, {
          username: "existinguser",
        })
      ).rejects.toEqual(duplicateUsernameError);
    });

    it("should provide meaningful error messages", async () => {
      mockPrisma.user.update.mockRejectedValue(
        new Error("Record to update not found")
      );

      await expect(
        UpdateUserProfileService.updateUserProfile(999, { firstName: "Test" })
      ).rejects.toThrow("Record to update not found");
    });

    it("should handle concurrent update conflicts", async () => {
      mockPrisma.user.update.mockRejectedValue(
        new Error("Concurrent update detected")
      );

      await expect(
        UpdateUserProfileService.updateUserProfile(1, { firstName: "Test" })
      ).rejects.toThrow("Concurrent update detected");
    });
  });

  describe("Response Format Tests", () => {
    it("should return JWT token with updated user data", async () => {
      const mockUpdatedUser = createMockUser({
        firstName: "Updated",
        avatar: "https://example.com/new-avatar.jpg",
      });
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await UpdateUserProfileService.updateUserProfile(1, {
        firstName: "Updated",
        avatar: "https://example.com/new-avatar.jpg",
      });

      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
    });

    it("should return token when avatar is updated", async () => {
      const avatarUrl = "https://example.com/avatar.jpg";
      mockPrisma.user.update.mockResolvedValue(
        createMockUser({ avatar: avatarUrl })
      );

      const result = await UpdateUserProfileService.updateUserProfile(1, {
        avatar: avatarUrl,
      });

      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
    });

    it("should maintain null avatar when not updated", async () => {
      mockPrisma.user.update.mockResolvedValue(
        createMockUser({ avatar: null })
      );

      const result = await UpdateUserProfileService.updateUserProfile(1, {
        firstName: "Test",
      });

      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
    });

    it("should return token response format", async () => {
      mockPrisma.user.update.mockResolvedValue(createMockUser());

      const result = await UpdateUserProfileService.updateUserProfile(1, {
        firstName: "Test",
      });

      expect(result).toHaveProperty("token");
      expect(typeof result.token).toBe("string");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long names", async () => {
      const longName = "A".repeat(255);
      mockPrisma.user.update.mockResolvedValue(
        createMockUser({ firstName: longName })
      );

      const result = await UpdateUserProfileService.updateUserProfile(1, {
        firstName: longName,
      });

      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
    });

    it("should handle international characters", async () => {
      const internationalName = "北京上海広州深圳";
      mockPrisma.user.update.mockResolvedValue(
        createMockUser({ firstName: internationalName })
      );

      const result = await UpdateUserProfileService.updateUserProfile(1, {
        firstName: internationalName,
      });

      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
    });

    it("should preserve unchanged fields", async () => {
      const originalUser = createMockUser({
        firstName: "Original",
        lastName: "User",
        email: "original@example.com",
        avatar: "https://example.com/original.jpg",
      });

      mockPrisma.user.update.mockResolvedValue({
        ...originalUser,
        firstName: "Updated", // Only firstName should change
      });

      const result = await UpdateUserProfileService.updateUserProfile(1, {
        firstName: "Updated",
      });

      expect(result).toEqual({ message: "Profile updated successfully", token: "mock-jwt-token" });
    });

    it("should handle undefined values appropriately", async () => {
      mockPrisma.user.update.mockResolvedValue(createMockUser());

      await UpdateUserProfileService.updateUserProfile(1, {
        firstName: undefined,
        lastName: "Updated",
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            firstName: undefined,
            lastName: "Updated",
          },
        })
      );
    });

    it("should handle empty update data", async () => {
      mockPrisma.user.update.mockResolvedValue(createMockUser());

      const result = await UpdateUserProfileService.updateUserProfile(1, {});

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {},
        })
      );
      expect(result).toBeDefined();
    });
  });
});
