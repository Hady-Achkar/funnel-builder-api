import { describe, it, expect, beforeEach, vi } from "vitest";
import { updateTheme } from "../../controllers";
import { createMockRequest, createMockResponse } from "./test-setup";

// Mock the theme service
vi.mock("../../services", () => ({
  ThemeService: {
    updateTheme: vi.fn(),
  },
}));

// Get the mocked service for access in tests
import { ThemeService } from "../../services";
const mockThemeService = ThemeService as any;

describe("updateTheme Controller", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockRes = createMockResponse();
    vi.clearAllMocks();
  });

  const setMockReq = (data: any) => {
    mockReq = createMockRequest(data.body, data.userId, data.params);
  };

  const getMockReq = () => mockReq;
  const getMockRes = () => mockRes;

  it("should return 401 when userId is missing", async () => {
    setMockReq({
      userId: undefined,
      params: { id: "1" },
      body: { name: "Test Theme" },
    });

    await updateTheme(getMockReq(), getMockRes());

    expect(getMockRes().status).toHaveBeenCalledWith(401);
    expect(getMockRes().json).toHaveBeenCalledWith({
      success: false,
      error: "Authentication required",
    });
  });

  it("should return 400 for invalid theme ID", async () => {
    vi.mocked(mockThemeService.updateTheme).mockRejectedValue(
      new Error("Theme ID must be positive")
    );

    setMockReq({
      userId: 1,
      params: { id: "0" },
      body: { name: "Test Theme" },
    });

    await updateTheme(getMockReq(), getMockRes());

    expect(getMockRes().status).toHaveBeenCalledWith(400);
    expect(getMockRes().json).toHaveBeenCalledWith({
      success: false,
      error: "Theme ID must be positive",
    });
  });

  it("should return 404 for non-existent theme", async () => {
    vi.mocked(mockThemeService.updateTheme).mockRejectedValue(
      new Error("Theme not found")
    );

    setMockReq({
      userId: 1,
      params: { id: "999" },
      body: { name: "Test Theme" },
    });

    await updateTheme(getMockReq(), getMockRes());

    expect(getMockRes().status).toHaveBeenCalledWith(404);
    expect(getMockRes().json).toHaveBeenCalledWith({
      success: false,
      error: "Theme not found",
    });
  });

  it("should return 403 for permission errors", async () => {
    vi.mocked(mockThemeService.updateTheme).mockRejectedValue(
      new Error("You don't have permission to update this theme")
    );

    setMockReq({
      userId: 1,
      params: { id: "1" },
      body: { name: "Test Theme" },
    });

    await updateTheme(getMockReq(), getMockRes());

    expect(getMockRes().status).toHaveBeenCalledWith(403);
    expect(getMockRes().json).toHaveBeenCalledWith({
      success: false,
      error: "You don't have permission to update this theme",
    });
  });

  it("should successfully update theme", async () => {
    vi.mocked(mockThemeService.updateTheme).mockResolvedValue({
      message: "Theme updated successfully",
    });

    setMockReq({
      userId: 1,
      params: { id: "1" },
      body: { name: "Updated Theme", backgroundColor: "#FF0000" },
    });

    await updateTheme(getMockReq(), getMockRes());

    expect(mockThemeService.updateTheme).toHaveBeenCalledWith(
      { themeId: 1 },
      1,
      { name: "Updated Theme", backgroundColor: "#FF0000" }
    );
    expect(getMockRes().json).toHaveBeenCalledWith({
      success: true,
      message: "Theme updated successfully",
    });
  });
});
