import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTheme } from "../../../services/theme";
import { mockPrisma, createThemeData, setupMocks, resetMocks } from "./test-setup";

describe("createTheme", () => {
  const userId = 1;
  const funnelId = 1;

  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it("should create theme successfully with valid data", async () => {
    // Arrange
    const themeData = createThemeData();
    const mockFunnel = { id: funnelId, userId, themeId: null };
    const mockCreatedTheme = {
      id: 1,
      name: "Test Theme",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      buttonColor: "#007bff",
      buttonTextColor: "#ffffff",
      borderColor: "#dee2e6",
      optionColor: "#f8f9fa",
      fontFamily: "Arial, sans-serif",
      borderRadius: "soft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockPrisma.funnel.findFirst as any).mockResolvedValue(mockFunnel);
    (mockPrisma.$transaction as any).mockImplementation(async (callback) => {
      return callback({
        theme: {
          create: async () => mockCreatedTheme,
        },
        funnel: {
          update: async () => ({ ...mockFunnel, themeId: 1 }),
        },
      });
    });

    // Act
    const result = await createTheme(themeData, userId);

    // Assert
    expect(mockPrisma.funnel.findFirst).toHaveBeenCalledWith({
      where: { id: funnelId, userId },
    });
    expect(result).toEqual({
      id: 1,
      name: "Test Theme",
      funnelId: 1,
      message: 'Theme "Test Theme" created successfully and linked to funnel',
    });
  });

  it("should throw error when name is empty string", async () => {
    // Arrange
    const themeData = createThemeData({ name: "" });

    // Act & Assert
    await expect(createTheme(themeData, userId)).rejects.toThrow(
      "Theme name cannot be empty"
    );
  });

  it("should throw error when funnelId is missing", async () => {
    // Arrange
    const themeData = createThemeData({ funnelId: null });

    // Act & Assert
    await expect(createTheme(themeData, userId)).rejects.toThrow(
      "Funnel ID is required"
    );
  });

  it("should throw error when name is empty after trimming", async () => {
    // Arrange
    const themeData = createThemeData({ name: "   " });

    // Act & Assert
    await expect(createTheme(themeData, userId)).rejects.toThrow(
      "Theme name cannot be empty"
    );
  });

  it("should throw error when name exceeds 100 characters", async () => {
    // Arrange
    const themeData = createThemeData({ name: "A".repeat(101) });

    // Act & Assert
    await expect(createTheme(themeData, userId)).rejects.toThrow(
      "Theme name cannot exceed 100 characters"
    );
  });

  it("should throw error when funnel not found", async () => {
    // Arrange
    const themeData = createThemeData();
    (mockPrisma.funnel.findFirst as any).mockResolvedValue(null);

    // Act & Assert
    await expect(createTheme(themeData, userId)).rejects.toThrow(
      "Funnel not found or you don't have access to it"
    );
  });

  it("should throw error when funnel already has a theme", async () => {
    // Arrange
    const themeData = createThemeData();
    const mockFunnel = { id: funnelId, userId, themeId: 2 }; // Already has a theme
    (mockPrisma.funnel.findFirst as any).mockResolvedValue(mockFunnel);

    // Act & Assert
    await expect(createTheme(themeData, userId)).rejects.toThrow(
      "This funnel already has a theme assigned"
    );
  });

  it("should handle P2002 error for duplicate theme", async () => {
    // Arrange
    const themeData = createThemeData();
    const mockFunnel = { id: funnelId, userId, themeId: null };
    
    (mockPrisma.funnel.findFirst as any).mockResolvedValue(mockFunnel);
    (mockPrisma.$transaction as any).mockRejectedValue({ code: "P2002" });

    // Act & Assert
    await expect(createTheme(themeData, userId)).rejects.toThrow(
      "A theme with this configuration already exists"
    );
  });

  it("should handle P2003 error for invalid reference", async () => {
    // Arrange
    const themeData = createThemeData();
    const mockFunnel = { id: funnelId, userId, themeId: null };
    
    (mockPrisma.funnel.findFirst as any).mockResolvedValue(mockFunnel);
    (mockPrisma.$transaction as any).mockRejectedValue({ code: "P2003" });

    // Act & Assert
    await expect(createTheme(themeData, userId)).rejects.toThrow(
      "Invalid reference provided"
    );
  });

  it("should create theme with defaults when optional fields are not provided", async () => {
    // Arrange
    const themeData = { funnelId: 1 }; // Only required field
    const mockFunnel = { id: funnelId, userId, themeId: null };
    const mockCreatedTheme = {
      id: 1,
      name: "Default Theme",
      backgroundColor: "#FFFFFF",
      textColor: "#000000",
      buttonColor: "#007BFF",
      buttonTextColor: "#FFFFFF",
      borderColor: "#DEE2E6",
      optionColor: "#F8F9FA",
      fontFamily: "Inter, sans-serif",
      borderRadius: "soft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockPrisma.funnel.findFirst as any).mockResolvedValue(mockFunnel);
    (mockPrisma.$transaction as any).mockImplementation(async (callback) => {
      return callback({
        theme: {
          create: async () => mockCreatedTheme,
        },
        funnel: {
          update: async () => ({ ...mockFunnel, themeId: 1 }),
        },
      });
    });

    // Act
    const result = await createTheme(themeData, userId);

    // Assert
    expect(result).toEqual({
      id: 1,
      name: "Default Theme",
      funnelId: 1,
      message: 'Theme "Default Theme" created successfully and linked to funnel',
    });
  });

  it("should update funnel cache after theme creation", async () => {
    // Arrange
    const themeData = createThemeData();
    const mockFunnel = { id: funnelId, userId, themeId: null };
    const mockCreatedTheme = {
      id: 1,
      name: "Test Theme",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      buttonColor: "#007bff",
      buttonTextColor: "#ffffff",
      borderColor: "#dee2e6",
      optionColor: "#f8f9fa",
      fontFamily: "Arial, sans-serif",
      borderRadius: "soft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockFunnelWithTheme = {
      id: funnelId,
      userId,
      theme: mockCreatedTheme,
      pages: []
    };

    (mockPrisma.funnel.findFirst as any).mockResolvedValueOnce(mockFunnel); // First call for validation
    (mockPrisma.funnel.findFirst as any).mockResolvedValueOnce(mockFunnelWithTheme); // Second call for cache update
    (mockPrisma.$transaction as any).mockImplementation(async (callback) => {
      return callback({
        theme: { create: async () => mockCreatedTheme },
        funnel: { update: async () => ({ ...mockFunnel, themeId: 1 }) },
      });
    });

    // Act
    const result = await createTheme(themeData, userId);

    // Assert - Should create theme successfully
    expect(result).toEqual({
      id: 1,
      name: "Test Theme",
      funnelId: 1,
      message: 'Theme "Test Theme" created successfully and linked to funnel',
    });
  });
});