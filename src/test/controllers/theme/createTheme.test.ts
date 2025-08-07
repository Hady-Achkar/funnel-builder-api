import { describe, it, expect, beforeEach, vi } from "vitest";
import { Request, Response } from "express";
import { createTheme } from "../../../controllers/theme";
import { createMockRequest, createMockResponse } from "./test-setup";

// Mock the theme service
vi.mock("../../../services/theme", () => ({
  createTheme: vi.fn(),
}));

import { createTheme as createThemeService } from "../../../services/theme";
const mockCreateTheme = createThemeService as ReturnType<typeof vi.fn>;

describe("createTheme", () => {
  beforeEach(() => {
    mockCreateTheme.mockClear();
  });

  it("should create theme successfully with valid data", async () => {
    // Arrange
    const mockThemeResponse = {
      id: 1,
      name: "Test Theme",
      funnelId: 1,
      message: 'Theme "Test Theme" created successfully and linked to funnel',
    };

    mockCreateTheme.mockResolvedValue(mockThemeResponse);
    const req = createMockRequest({ name: "Test Theme", funnelId: 1 }, 1);
    const res = createMockResponse();

    // Act
    await createTheme(req as Request, res as Response);

    // Assert
    expect(mockCreateTheme).toHaveBeenCalledWith(
      {
        name: "Test Theme",
        funnelId: 1,
      },
      1
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      id: 1,
      name: "Test Theme",
      funnelId: 1,
      message: 'Theme "Test Theme" created successfully and linked to funnel',
    });
  });

  it("should return 400 when funnelId is missing", async () => {
    // Arrange
    const req = createMockRequest({ name: "Test Theme" }, 1); // No funnelId provided
    const res = createMockResponse();

    // Act
    await createTheme(req as Request, res as Response);

    // Assert
    expect(mockCreateTheme).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Funnel ID is required",
    });
  });

  it("should return 401 when user is not authenticated", async () => {
    // Arrange
    const req = createMockRequest({ name: "Test Theme", funnelId: 1 }); // No userId
    const res = createMockResponse();

    // Act
    await createTheme(req as Request, res as Response);

    // Assert
    expect(mockCreateTheme).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "User authentication required",
    });
  });

  it("should return 404 when funnel not found", async () => {
    // Arrange
    const req = createMockRequest({ name: "Test Theme", funnelId: 999 }, 1);
    const res = createMockResponse();

    mockCreateTheme.mockRejectedValue(
      new Error("Funnel not found or you don't have access to it")
    );

    // Act
    await createTheme(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Funnel not found or you don't have access to it",
    });
  });

  it("should return 400 for validation errors from service", async () => {
    // Arrange
    const req = createMockRequest({ name: "A".repeat(101), funnelId: 1 }, 1);
    const res = createMockResponse();

    mockCreateTheme.mockRejectedValue(
      new Error("Theme name cannot exceed 100 characters")
    );

    // Act
    await createTheme(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Theme name cannot exceed 100 characters",
    });
  });

  it("should return 409 for duplicate theme error", async () => {
    // Arrange
    const req = createMockRequest({ name: "Test Theme", funnelId: 1 }, 1);
    const res = createMockResponse();

    mockCreateTheme.mockRejectedValue(
      new Error("A theme with this configuration already exists")
    );

    // Act
    await createTheme(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "A theme with this configuration already exists",
    });
  });

  it("should return 409 for funnel already has theme error", async () => {
    // Arrange
    const req = createMockRequest({ name: "Test Theme", funnelId: 1 }, 1);
    const res = createMockResponse();

    mockCreateTheme.mockRejectedValue(
      new Error("This funnel already has a theme assigned")
    );

    // Act
    await createTheme(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "This funnel already has a theme assigned",
    });
  });

  it("should return 500 for unexpected errors", async () => {
    // Arrange
    const req = createMockRequest({ name: "Test Theme", funnelId: 1 }, 1);
    const res = createMockResponse();

    mockCreateTheme.mockRejectedValue(new Error("Unexpected database error"));

    // Act
    await createTheme(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Failed to create theme. Please try again later.",
    });
  });
});