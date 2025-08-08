import { describe, it, expect, beforeEach, vi } from "vitest";
import { updateTheme } from "../../../controllers/theme";
import { createMockRequest, createMockResponse } from "./test-setup";

describe("updateTheme Controller - Basic Tests", () => {
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

  it("should return 400 for invalid theme ID", async () => {
    setMockReq({ 
      userId: 1,
      params: { id: "invalid" },
      body: { name: "Test Theme" }
    });

    await updateTheme(getMockReq(), getMockRes());

    expect(getMockRes().status).toHaveBeenCalledWith(400);
    expect(getMockRes().json).toHaveBeenCalledWith({
      success: false,
      error: "Invalid theme ID"
    });
  });

  it("should return 400 for non-existent theme", async () => {
    setMockReq({ 
      userId: 1,
      params: { id: "999" }, // Non-existent theme
      body: { name: "Test Theme" }
    });

    await updateTheme(getMockReq(), getMockRes());

    expect(getMockRes().status).toHaveBeenCalledWith(404);
    expect(getMockRes().json).toHaveBeenCalledWith({
      success: false,
      error: expect.stringContaining("not found")
    });
  });
});