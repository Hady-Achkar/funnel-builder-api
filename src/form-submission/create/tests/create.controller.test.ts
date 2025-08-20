import { Request, Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFormSubmissionController } from "../controller/create.controller";

vi.mock("../service/create.service", () => ({
  createFormSubmission: vi.fn(),
}));

import { createFormSubmission } from "../service/create.service";
const mockCreateFormSubmission = vi.mocked(createFormSubmission);

describe("Create Form Submission Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {
        formId: 1,
        sessionId: "session123",
        submittedData: { field1: "value1", field2: "value2" },
        isCompleted: true,
      },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  it("should create form submission successfully", async () => {
    const mockResponse = { 
      message: "Form submission created successfully",
      submissionId: 1
    };
    mockCreateFormSubmission.mockResolvedValue(mockResponse);

    await createFormSubmissionController(mockReq as Request, mockRes as Response, mockNext);

    expect(mockCreateFormSubmission).toHaveBeenCalledWith(mockReq.body);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should handle service errors", async () => {
    const error = new Error("Service error");
    mockCreateFormSubmission.mockRejectedValue(error);

    await createFormSubmissionController(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should handle form submission with minimal data", async () => {
    mockReq.body = {
      formId: 1,
      sessionId: "session123",
      // No submittedData, isCompleted defaults to true
    };

    const mockResponse = { 
      message: "Form submission created successfully",
      submissionId: 2
    };
    mockCreateFormSubmission.mockResolvedValue(mockResponse);

    await createFormSubmissionController(mockReq as Request, mockRes as Response, mockNext);

    expect(mockCreateFormSubmission).toHaveBeenCalledWith(mockReq.body);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should handle form submission with incomplete status", async () => {
    mockReq.body = {
      formId: 1,
      sessionId: "session123",
      submittedData: { field1: "partial" },
      isCompleted: false,
    };

    const mockResponse = { 
      message: "Form submission created successfully",
      submissionId: 3
    };
    mockCreateFormSubmission.mockResolvedValue(mockResponse);

    await createFormSubmissionController(mockReq as Request, mockRes as Response, mockNext);

    expect(mockCreateFormSubmission).toHaveBeenCalledWith(mockReq.body);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should handle complex submitted data", async () => {
    mockReq.body = {
      formId: 1,
      sessionId: "session123",
      submittedData: {
        name: "John Doe",
        email: "john@example.com",
        preferences: {
          newsletter: true,
          notifications: false,
        },
        tags: ["customer", "vip"],
      },
      isCompleted: true,
    };

    const mockResponse = { 
      message: "Form submission created successfully",
      submissionId: 4
    };
    mockCreateFormSubmission.mockResolvedValue(mockResponse);

    await createFormSubmissionController(mockReq as Request, mockRes as Response, mockNext);

    expect(mockCreateFormSubmission).toHaveBeenCalledWith(mockReq.body);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should handle null submitted data", async () => {
    mockReq.body = {
      formId: 1,
      sessionId: "session123",
      submittedData: null,
      isCompleted: true,
    };

    const mockResponse = { 
      message: "Form submission created successfully",
      submissionId: 5
    };
    mockCreateFormSubmission.mockResolvedValue(mockResponse);

    await createFormSubmissionController(mockReq as Request, mockRes as Response, mockNext);

    expect(mockCreateFormSubmission).toHaveBeenCalledWith(mockReq.body);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });

  it("should handle form submission update", async () => {
    mockReq.body = {
      formId: 1,
      sessionId: "session123",
      submittedData: { field1: "updated_value" },
      isCompleted: true,
    };

    const mockResponse = { 
      message: "Form submission updated successfully",
      submissionId: 1
    };
    mockCreateFormSubmission.mockResolvedValue(mockResponse);

    await createFormSubmissionController(mockReq as Request, mockRes as Response, mockNext);

    expect(mockCreateFormSubmission).toHaveBeenCalledWith(mockReq.body);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(mockResponse);
  });
});