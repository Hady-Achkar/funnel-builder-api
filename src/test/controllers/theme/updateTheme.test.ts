import { describe, it, expect, beforeEach, vi } from "vitest";
import { Request, Response } from "express";
import { updateTheme } from "../../../controllers/theme";
import { createMockRequest, createMockResponse } from "./test-setup";

// Mock the theme service
vi.mock("../../../services/theme", () => ({
  updateTheme: vi.fn(),
}));

import { updateTheme as updateThemeService } from "../../../services/theme";
const mockUpdateTheme = updateThemeService as ReturnType<typeof vi.fn>;

describe("updateTheme", () => {
  beforeEach(() => {
    mockUpdateTheme.mockClear();
  });

  it("should update theme successfully with valid data", async () => {
    // Arrange
    const mockThemeResponse = {
      id: 1,
      name: "Updated Theme",
      message: 'Theme "Updated Theme" updated successfully',
    };

    mockUpdateTheme.mockResolvedValue(mockThemeResponse);
    const req = createMockRequest(
      { name: "Updated Theme", backgroundColor: "#000000" },
      1,
      { id: "1" }
    );
    const res = createMockResponse();

    // Act
    await updateTheme(req as Request, res as Response);

    // Assert
    expect(mockUpdateTheme).toHaveBeenCalledWith(
      1,
      { name: "Updated Theme", backgroundColor: "#000000" },
      1
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      id: 1,
      name: "Updated Theme",
      message: 'Theme "Updated Theme" updated successfully',
    });
  });

  it("should return 400 for invalid theme ID", async () => {
    // Arrange
    const req = createMockRequest({ name: "Test" }, 1, { id: "invalid" });
    const res = createMockResponse();

    // Act
    await updateTheme(req as Request, res as Response);

    // Assert
    expect(mockUpdateTheme).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Valid theme ID is required",
    });
  });

  it("should return 401 when user is not authenticated", async () => {
    // Arrange
    const req = createMockRequest({ name: "Test" }, undefined, { id: "1" });
    const res = createMockResponse();

    // Act
    await updateTheme(req as Request, res as Response);

    // Assert
    expect(mockUpdateTheme).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "User authentication required",
    });
  });

  it("should handle partial updates correctly", async () => {
    // Arrange
    const mockThemeResponse = {
      id: 1,
      name: "Theme Name",
      message: 'Theme "Theme Name" updated successfully',
    };

    mockUpdateTheme.mockResolvedValue(mockThemeResponse);
    const req = createMockRequest(
      { textColor: "#333333", borderRadius: "sharp" },
      1,
      { id: "1" }
    );
    const res = createMockResponse();

    // Act
    await updateTheme(req as Request, res as Response);

    // Assert
    expect(mockUpdateTheme).toHaveBeenCalledWith(
      1,
      { textColor: "#333333", borderRadius: "sharp" },
      1
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should return 400 when must be provided error", async () => {
    // Arrange
    const req = createMockRequest({ name: "" }, 1, { id: "1" });
    const res = createMockResponse();

    mockUpdateTheme.mockRejectedValue(
      new Error("At least one field must be provided for update")
    );

    // Act
    await updateTheme(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "At least one field must be provided for update",
    });
  });

  it("should return 404 when theme not found", async () => {
    // Arrange
    const req = createMockRequest({ name: "Test" }, 1, { id: "999" });
    const res = createMockResponse();

    mockUpdateTheme.mockRejectedValue(new Error("Theme not found"));

    // Act
    await updateTheme(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Theme not found",
    });
  });

  it("should return 404 when user lacks permission", async () => {
    // Arrange
    const req = createMockRequest({ name: "Test" }, 2, { id: "1" });
    const res = createMockResponse();

    mockUpdateTheme.mockRejectedValue(
      new Error("You don't have permission to update this theme")
    );

    // Act
    await updateTheme(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "You don't have permission to update this theme",
    });
  });

  it("should return 409 when theme name already exists", async () => {
    // Arrange
    const req = createMockRequest({ name: "Existing Theme" }, 1, { id: "1" });
    const res = createMockResponse();

    mockUpdateTheme.mockRejectedValue(
      new Error("A theme with this configuration already exists")
    );

    // Act
    await updateTheme(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "A theme with this configuration already exists",
    });
  });

  it("should handle all theme properties in update", async () => {
    // Arrange
    const fullUpdateData = {
      name: "Full Update Theme",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      buttonColor: "#007bff",
      buttonTextColor: "#ffffff",
      borderColor: "#dee2e6",
      optionColor: "#f8f9fa",
      fontFamily: "Arial, sans-serif",
      borderRadius: "soft",
    };

    const mockThemeResponse = {
      id: 1,
      name: "Full Update Theme",
      message: 'Theme "Full Update Theme" updated successfully',
    };

    mockUpdateTheme.mockResolvedValue(mockThemeResponse);
    const req = createMockRequest(fullUpdateData, 1, { id: "1" });
    const res = createMockResponse();

    // Act
    await updateTheme(req as Request, res as Response);

    // Assert
    expect(mockUpdateTheme).toHaveBeenCalledWith(1, fullUpdateData, 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      ...mockThemeResponse,
    });
  });

  it("should handle unexpected errors with 500 status", async () => {
    // Arrange
    const req = createMockRequest({ name: "Test" }, 1, { id: "1" });
    const res = createMockResponse();

    mockUpdateTheme.mockRejectedValue(new Error("Unexpected database error"));

    // Act
    await updateTheme(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Failed to update theme. Please try again later.",
    });
  });

  it("should return success message with cache refresh indication", async () => {
    // Arrange
    const mockThemeResponse = {
      id: 1,
      name: "Cache Updated Theme",
      message: 'Theme "Cache Updated Theme" updated successfully and cache refreshed',
    };

    mockUpdateTheme.mockResolvedValue(mockThemeResponse);
    const req = createMockRequest(
      { name: "Cache Updated Theme", backgroundColor: "#ff5722" },
      1,
      { id: "1" }
    );
    const res = createMockResponse();

    // Act
    await updateTheme(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      id: 1,
      name: "Cache Updated Theme",
      message: 'Theme "Cache Updated Theme" updated successfully and cache refreshed',
    });
  });
});