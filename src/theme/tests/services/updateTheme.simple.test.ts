import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { updateTheme } from "../../services";
import { setupMocks, resetMocks, mockPrisma, createThemeData } from "./test-setup";

describe("updateTheme Service", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it("should validate themeId parameter", async () => {
    await expect(updateTheme({ themeId: 0 }, 1, { name: "Test" })).rejects.toThrow(
      "Theme ID must be positive"
    );
  });

  it("should validate no updates provided", async () => {
    await expect(updateTheme({ themeId: 1 }, 1, {})).rejects.toThrow(
      "No updates provided"
    );
  });

  it("should validate theme exists", async () => {
    mockPrisma.theme.findFirst.mockResolvedValue(null);
    
    await expect(updateTheme({ themeId: 999 }, 1, { name: "Test" })).rejects.toThrow(
      "Theme not found"
    );
  });

  it("should validate theme has funnel association", async () => {
    const mockTheme = createThemeData({ id: 1 });
    mockPrisma.theme.findFirst.mockResolvedValue({
      ...mockTheme,
      funnel: null
    });
    
    await expect(updateTheme({ themeId: 1 }, 1, { name: "Test" })).rejects.toThrow(
      "You don't have permission to update this theme"
    );
  });

  it("should validate user owns the funnel", async () => {
    const mockTheme = createThemeData({ id: 1 });
    mockPrisma.theme.findFirst.mockResolvedValue({
      ...mockTheme,
      funnel: { id: 1, userId: 999 }
    });
    
    await expect(updateTheme({ themeId: 1 }, 1, { name: "Test" })).rejects.toThrow(
      "You don't have permission to update this theme"
    );
  });

  it("should successfully update theme", async () => {
    const mockTheme = createThemeData({ id: 1, name: "Old Theme" });
    const updatedTheme = { ...mockTheme, name: "New Theme" };
    
    mockPrisma.theme.findFirst.mockResolvedValue({
      ...mockTheme,
      funnel: { id: 1, userId: 1 }
    });
    mockPrisma.theme.update.mockResolvedValue(updatedTheme);

    const result = await updateTheme(
      { themeId: 1 }, 
      1, 
      { name: "New Theme", backgroundColor: "#FF0000" }
    );

    expect(result.message).toBe("Theme updated successfully");
    expect(mockPrisma.theme.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: "New Theme", backgroundColor: "#FF0000" }
    });
  });
});