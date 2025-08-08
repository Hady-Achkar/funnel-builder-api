import { describe, it, expect } from "vitest";
import { updateTheme } from "../../../services/theme";

describe("updateTheme Service - Basic Tests", () => {
  it("should validate required parameters", async () => {
    await expect(updateTheme(0, 1, { name: "Test" })).rejects.toThrow(
      "Please provide themeId and userId."
    );
  });

  it("should validate update data", async () => {
    await expect(updateTheme(1, 1, {})).rejects.toThrow(
      "No updates provided."
    );
  });

  it("should validate theme exists", async () => {
    // This will fail because theme doesn't exist in test DB
    await expect(updateTheme(999, 1, { name: "Test" })).rejects.toThrow(
      "Theme not found."
    );
  });
});