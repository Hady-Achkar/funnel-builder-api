import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createDefaultTheme } from "../../../services/theme";
import { mockPrisma, setupMocks, resetMocks } from "./test-setup";

describe("createDefaultTheme", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it("should create default theme with all default values", async () => {
    // Arrange
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

    mockPrisma.theme.create.mockResolvedValue(mockCreatedTheme);

    // Act
    const result = await createDefaultTheme();

    // Assert
    expect(mockPrisma.theme.create).toHaveBeenCalledWith({
      data: {},
    });
    expect(result).toEqual({
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
      createdAt: mockCreatedTheme.createdAt,
      updatedAt: mockCreatedTheme.updatedAt,
    });
  });

  it("should handle P2002 error for duplicate theme name", async () => {
    // Arrange
    mockPrisma.theme.create.mockRejectedValue({ code: "P2002" });

    // Act & Assert
    await expect(createDefaultTheme()).rejects.toThrow(
      "Failed to create theme: theme name already exists"
    );
  });

  it("should handle unexpected errors", async () => {
    // Arrange
    mockPrisma.theme.create.mockRejectedValue(new Error("Database connection failed"));

    // Act & Assert
    await expect(createDefaultTheme()).rejects.toThrow(
      "Failed to create default theme"
    );
  });
});