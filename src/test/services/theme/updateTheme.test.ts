import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { updateTheme } from "../../../services/theme";
import { mockPrisma, setupMocks, resetMocks, mockCacheService } from "./test-setup";
import { BorderRadius } from "../../../types/theme.types";

describe("updateTheme", () => {
  const userId = 1;
  const themeId = 1;

  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it("should update theme successfully with valid data", async () => {
    // Arrange
    const updateData = {
      name: "Updated Theme",
      backgroundColor: "#000000",
    };

    const existingTheme = {
      id: themeId,
      name: "Original Theme",
      funnel: { id: 1, userId },
    };

    const updatedTheme = {
      id: themeId,
      name: "Updated Theme",
      backgroundColor: "#000000",
    };

    const updatedThemeWithFunnel = {
      id: themeId,
      name: "Updated Theme",
      backgroundColor: "#000000",
      textColor: "#ffffff",
      buttonColor: "#007bff",
      buttonTextColor: "#ffffff",
      borderColor: "#dee2e6",
      optionColor: "#f8f9fa",
      fontFamily: "Arial",
      borderRadius: "soft",
      funnel: {
        id: 1,
        userId,
        pages: []
      }
    };

    (mockPrisma.theme.findFirst as any).mockResolvedValue(existingTheme);
    (mockPrisma.theme.update as any).mockResolvedValue(updatedThemeWithFunnel);

    // Act
    const result = await updateTheme(themeId, updateData, userId);

    // Assert
    expect(mockPrisma.theme.findFirst).toHaveBeenCalledWith({
      where: { id: themeId },
      include: { funnel: true },
    });
    expect(mockPrisma.theme.update).toHaveBeenCalledWith({
      where: { id: themeId },
      data: updateData,
      include: {
        funnel: {
          include: {
            pages: true,
          }
        }
      }
    });
    expect(result).toEqual({
      id: themeId,
      name: "Updated Theme",
      message: 'Theme "Updated Theme" updated successfully and cache refreshed',
    });
  });

  it("should throw error for invalid theme ID (0)", async () => {
    // Act & Assert
    await expect(updateTheme(0, { name: "Test" }, userId)).rejects.toThrow(
      "Valid theme ID is required"
    );
  });

  it("should throw error for negative theme ID", async () => {
    // Act & Assert
    await expect(updateTheme(-1, { name: "Test" }, userId)).rejects.toThrow(
      "Valid theme ID is required"
    );
  });

  it("should throw error when no update data provided", async () => {
    // Act & Assert
    await expect(updateTheme(themeId, {}, userId)).rejects.toThrow(
      "At least one field must be provided for update"
    );
  });

  it("should trim and validate theme name", async () => {
    // Arrange
    const updateData = { name: "  Updated Theme  " };
    const existingTheme = {
      id: themeId,
      name: "Original Theme",
      funnel: { id: 1, userId },
    };
    const updatedTheme = {
      id: themeId,
      name: "Updated Theme",
    };

    (mockPrisma.theme.findFirst as any).mockResolvedValue(existingTheme);
    (mockPrisma.theme.update as any).mockResolvedValue(updatedTheme);

    // Act
    await updateTheme(themeId, updateData, userId);

    // Assert
    expect(mockPrisma.theme.update).toHaveBeenCalledWith({
      where: { id: themeId },
      data: { name: "Updated Theme" }, // Trimmed
      include: {
        funnel: {
          include: {
            pages: true,
          }
        }
      }
    });
  });

  it("should throw error when name is empty after trimming", async () => {
    // Act & Assert
    await expect(updateTheme(themeId, { name: "   " }, userId)).rejects.toThrow(
      "Theme name cannot be empty"
    );
  });

  it("should throw error when name exceeds 100 characters", async () => {
    // Act & Assert
    await expect(updateTheme(themeId, { name: "A".repeat(101) }, userId)).rejects.toThrow(
      "Theme name cannot exceed 100 characters"
    );
  });

  it("should throw error when theme not found", async () => {
    // Arrange
    (mockPrisma.theme.findFirst as any).mockResolvedValue(null);

    // Act & Assert
    await expect(updateTheme(themeId, { name: "Test" }, userId)).rejects.toThrow(
      "Theme not found"
    );
  });

  it("should throw error when user doesn't own the funnel", async () => {
    // Arrange
    const existingTheme = {
      id: themeId,
      name: "Original Theme",
      funnel: { id: 1, userId: 999 }, // Different user
    };

    (mockPrisma.theme.findFirst as any).mockResolvedValue(existingTheme);

    // Act & Assert
    const unauthorizedUserId = 2;
    await expect(updateTheme(themeId, { name: "Test" }, unauthorizedUserId)).rejects.toThrow(
      "You don't have permission to update this theme"
    );
  });

  it("should handle partial updates with multiple fields", async () => {
    // Arrange
    const updateData = {
      backgroundColor: "#333333",
      textColor: "#ffffff",
      buttonColor: "#28a745",
      borderRadius: "NONE" as BorderRadius,
    };

    const existingTheme = {
      id: themeId,
      name: "Original Theme",
      funnel: { id: 1, userId },
    };

    const updatedTheme = {
      id: themeId,
      name: "Original Theme",
      ...updateData,
    };

    (mockPrisma.theme.findFirst as any).mockResolvedValue(existingTheme);
    (mockPrisma.theme.update as any).mockResolvedValue(updatedTheme);

    // Act
    const result = await updateTheme(themeId, updateData, userId);

    // Assert
    expect(mockPrisma.theme.update).toHaveBeenCalledWith({
      where: { id: themeId },
      data: updateData,
      include: {
        funnel: {
          include: {
            pages: true,
          }
        }
      }
    });
    expect(result).toEqual({
      id: themeId,
      name: "Original Theme",
      message: 'Theme "Original Theme" updated successfully',
    });
  });

  it("should handle P2002 error for duplicate configuration", async () => {
    // Arrange
    const updateData = { name: "Duplicate Theme" };
    const existingTheme = {
      id: themeId,
      name: "Original Theme",
      funnel: { id: 1, userId },
    };

    (mockPrisma.theme.findFirst as any).mockResolvedValue(existingTheme);
    (mockPrisma.theme.update as any).mockRejectedValue({ code: "P2002" });

    // Act & Assert
    await expect(updateTheme(themeId, updateData, userId)).rejects.toThrow(
      "A theme with this configuration already exists"
    );
  });

  it("should handle P2025 error for theme not found during update", async () => {
    // Arrange
    const updateData = { name: "Test" };
    const existingTheme = {
      id: themeId,
      name: "Original Theme",
      funnel: { id: 1, userId },
    };

    (mockPrisma.theme.findFirst as any).mockResolvedValue(existingTheme);
    (mockPrisma.theme.update as any).mockRejectedValue({ code: "P2025" });

    // Act & Assert
    await expect(updateTheme(themeId, updateData, userId)).rejects.toThrow(
      "Theme not found"
    );
  });

  it("should handle unexpected database errors", async () => {
    // Arrange
    const updateData = { name: "Test" };
    const existingTheme = {
      id: themeId,
      name: "Original Theme",
      funnel: { id: 1, userId },
    };

    (mockPrisma.theme.findFirst as any).mockResolvedValue(existingTheme);
    (mockPrisma.theme.update as any).mockRejectedValue(new Error("Database connection failed"));

    // Act & Assert
    await expect(updateTheme(themeId, updateData, userId)).rejects.toThrow(
      "Failed to update theme. Please try again later."
    );
  });

  it("should update only defined fields and ignore undefined ones", async () => {
    // Arrange
    const updateData = {
      name: undefined,
      backgroundColor: "#ffffff",
      textColor: undefined,
      buttonColor: "#007bff",
    };

    const existingTheme = {
      id: themeId,
      name: "Original Theme",
      funnel: { id: 1, userId },
    };

    const updatedTheme = {
      id: themeId,
      name: "Original Theme",
      backgroundColor: "#ffffff",
      buttonColor: "#007bff",
    };

    (mockPrisma.theme.findFirst as any).mockResolvedValue(existingTheme);
    (mockPrisma.theme.update as any).mockResolvedValue(updatedTheme);

    // Act
    await updateTheme(themeId, updateData, userId);

    // Assert
    // Only the defined fields should be in the update call
    expect(mockPrisma.theme.update).toHaveBeenCalledWith({
      where: { id: themeId },
      data: {
        backgroundColor: "#ffffff",
        buttonColor: "#007bff",
      },
      include: {
        funnel: {
          include: {
            pages: true,
          }
        }
      }
    });
  });

  it("should handle theme without associated funnel", async () => {
    // Arrange
    const updateData = { name: "Updated Theme" };
    const existingTheme = {
      id: themeId,
      name: "Original Theme",
      funnel: null, // No associated funnel
    };

    const updatedTheme = {
      id: themeId,
      name: "Updated Theme",
    };

    (mockPrisma.theme.findFirst as any).mockResolvedValue(existingTheme);
    (mockPrisma.theme.update as any).mockResolvedValue(updatedTheme);

    // Act
    await updateTheme(themeId, updateData, userId);

    // Assert
    // Should proceed with update since there's no funnel to check ownership
    expect(mockPrisma.theme.update).toHaveBeenCalledWith({
      where: { id: themeId },
      data: updateData,
      include: {
        funnel: {
          include: {
            pages: true,
          }
        }
      }
    });
  });

  it("should update funnel cache when theme has associated funnel", async () => {
    // Arrange
    const updateData = { name: "Cache Test Theme", backgroundColor: "#123456" };
    
    const existingTheme = {
      id: themeId,
      name: "Original Theme",
      funnel: { id: 1, userId },
    };

    const updatedThemeWithFunnel = {
      id: themeId,
      name: "Cache Test Theme",
      backgroundColor: "#123456",
      textColor: "#ffffff",
      buttonColor: "#007bff",
      buttonTextColor: "#ffffff",
      borderColor: "#dee2e6",
      optionColor: "#f8f9fa",
      fontFamily: "Arial",
      borderRadius: "soft",
      funnel: {
        id: 1,
        userId,
        pages: []
      }
    };

    (mockPrisma.theme.findFirst as any).mockResolvedValue(existingTheme);
    (mockPrisma.theme.update as any).mockResolvedValue(updatedThemeWithFunnel);

    // Act
    const result = await updateTheme(themeId, updateData, userId);

    // Assert - Should update theme successfully with cache refresh message
    expect(result).toEqual({
      id: themeId,
      name: "Cache Test Theme",
      message: 'Theme "Cache Test Theme" updated successfully and cache refreshed',
    });
  });

  it("should not update cache when theme has no associated funnel", async () => {
    // Arrange
    const updateData = { name: "No Funnel Theme" };
    
    const existingTheme = {
      id: themeId,
      name: "Original Theme",
      funnel: null, // No associated funnel
    };

    const updatedTheme = {
      id: themeId,
      name: "No Funnel Theme",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      buttonColor: "#007bff",
      buttonTextColor: "#ffffff",
      borderColor: "#dee2e6",
      optionColor: "#f8f9fa",
      fontFamily: "Arial",
      borderRadius: "soft",
      funnel: null
    };

    (mockPrisma.theme.findFirst as any).mockResolvedValue(existingTheme);
    (mockPrisma.theme.update as any).mockResolvedValue(updatedTheme);

    // Act
    const result = await updateTheme(themeId, updateData, userId);

    // Assert - Should not call cache methods
    expect(mockCacheService.getUserFunnelCache).not.toHaveBeenCalled();
    expect(mockCacheService.setUserFunnelCache).not.toHaveBeenCalled();
    expect(result.message).toBe('Theme "No Funnel Theme" updated successfully');
  });
});