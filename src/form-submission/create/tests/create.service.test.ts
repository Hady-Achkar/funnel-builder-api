import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFormSubmission } from "../service/create.service";
import { getPrisma } from "../../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../../errors";

vi.mock("../../../lib/prisma");

const mockGetPrisma = vi.mocked(getPrisma);

describe("Create Form Submission Service", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      form: {
        findUnique: vi.fn(),
      },
      session: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      formSubmission: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    mockGetPrisma.mockReturnValue(mockPrisma);
    vi.clearAllMocks();
  });

  it("should create form submission successfully", async () => {
    const request = {
      formId: 1,
      sessionId: "session123",
      submittedData: { field1: "value1", field2: "value2" },
      isCompleted: true,
    };

    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      isActive: true,
      name: "Test Form",
    });

    mockPrisma.session.findUnique.mockResolvedValue({
      id: 1,
      sessionId: "session123",
      interactions: {},
    });

    mockPrisma.formSubmission.findUnique.mockResolvedValue(null); // No existing submission

    // Mock the transaction
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      const mockTx = {
        formSubmission: {
          create: vi.fn().mockResolvedValue({
            id: 1,
            formId: 1,
            sessionId: "session123",
            submittedData: { field1: "value1", field2: "value2" },
            isCompleted: true,
            completedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        session: {
          update: vi.fn().mockResolvedValue({}),
        },
      };
      return callback(mockTx);
    });

    const result = await createFormSubmission(request);

    expect(result.message).toBe("Form submission created successfully");
    expect(result.submissionId).toBe(1);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("should create form submission with incomplete status", async () => {
    const request = {
      formId: 1,
      sessionId: "session123",
      submittedData: { field1: "value1" },
      isCompleted: false,
    };

    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      isActive: true,
      name: "Test Form",
    });

    mockPrisma.session.findUnique.mockResolvedValue({
      id: 1,
      sessionId: "session123",
      interactions: {},
    });

    mockPrisma.formSubmission.findUnique.mockResolvedValue(null);

    // Mock the transaction
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      const mockTx = {
        formSubmission: {
          create: vi.fn().mockResolvedValue({
            id: 2,
            formId: 1,
            sessionId: "session123",
            submittedData: { field1: "value1" },
            isCompleted: false,
            completedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        session: {
          update: vi.fn().mockResolvedValue({}),
        },
      };
      return callback(mockTx);
    });

    const result = await createFormSubmission(request);

    expect(result.message).toBe("Form submission created successfully");
    expect(result.submissionId).toBe(2);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("should use default isCompleted value as true", async () => {
    const request = {
      formId: 1,
      sessionId: "session123",
      submittedData: { field1: "value1" },
      // isCompleted not provided - should default to true
    };

    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      isActive: true,
      name: "Test Form",
    });

    mockPrisma.session.findUnique.mockResolvedValue({
      id: 1,
      sessionId: "session123",
      interactions: {},
    });

    mockPrisma.formSubmission.findUnique.mockResolvedValue(null);

    // Mock the transaction
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      const mockTx = {
        formSubmission: {
          create: vi.fn().mockResolvedValue({
            id: 3,
            formId: 1,
            sessionId: "session123",
            submittedData: { field1: "value1" },
            isCompleted: true,
            completedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        session: {
          update: vi.fn().mockResolvedValue({}),
        },
      };
      return callback(mockTx);
    });

    const result = await createFormSubmission(request);

    expect(result.submissionId).toBe(3);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("should throw NotFoundError when form not found", async () => {
    mockPrisma.form.findUnique.mockResolvedValue(null);

    await expect(createFormSubmission({
      formId: 999,
      sessionId: "session123",
    })).rejects.toThrow(NotFoundError);
  });

  it("should throw BadRequestError when form is not active", async () => {
    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      isActive: false,
      name: "Inactive Form",
    });

    await expect(createFormSubmission({
      formId: 1,
      sessionId: "session123",
    })).rejects.toThrow(BadRequestError);
  });

  it("should throw NotFoundError when session not found", async () => {
    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      isActive: true,
      name: "Test Form",
    });

    mockPrisma.session.findUnique.mockResolvedValue(null);

    await expect(createFormSubmission({
      formId: 1,
      sessionId: "nonexistent-session",
    })).rejects.toThrow(NotFoundError);
  });

  it("should throw BadRequestError when submission already exists", async () => {
    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      isActive: true,
      name: "Test Form",
    });

    mockPrisma.session.findUnique.mockResolvedValue({
      id: 1,
      sessionId: "session123",
      interactions: {},
    });

    mockPrisma.formSubmission.findUnique.mockResolvedValue({
      id: 1,
      formId: 1,
      sessionId: "session123",
    }); // Existing submission

    await expect(createFormSubmission({
      formId: 1,
      sessionId: "session123",
    })).rejects.toThrow(BadRequestError);
  });

  it("should handle empty submitted data", async () => {
    const request = {
      formId: 1,
      sessionId: "session123",
      submittedData: null,
      isCompleted: true,
    };

    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      isActive: true,
      name: "Test Form",
    });

    mockPrisma.session.findUnique.mockResolvedValue({
      id: 1,
      sessionId: "session123",
      interactions: {},
    });

    mockPrisma.formSubmission.findUnique.mockResolvedValue(null);

    // Mock the transaction
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      const mockTx = {
        formSubmission: {
          create: vi.fn().mockResolvedValue({
            id: 4,
            formId: 1,
            sessionId: "session123",
            submittedData: null,
            isCompleted: true,
            completedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        session: {
          update: vi.fn().mockResolvedValue({}),
        },
      };
      return callback(mockTx);
    });

    const result = await createFormSubmission(request);

    expect(result.submissionId).toBe(4);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("should throw BadRequestError for invalid data", async () => {
    await expect(createFormSubmission({
      formId: 0, // Invalid - must be positive
      sessionId: "session123",
    })).rejects.toThrow(BadRequestError);
  });

  it("should throw BadRequestError for empty session ID", async () => {
    await expect(createFormSubmission({
      formId: 1,
      sessionId: "", // Invalid - empty string
    })).rejects.toThrow(BadRequestError);
  });

  it("should update session interactions correctly", async () => {
    const request = {
      formId: 1,
      sessionId: "session123",
      submittedData: { name: "John Doe" },
      isCompleted: true,
    };

    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      isActive: true,
      name: "Contact Form",
    });

    mockPrisma.session.findUnique.mockResolvedValue({
      id: 1,
      sessionId: "session123",
      interactions: { existing_data: "test" },
    });

    mockPrisma.formSubmission.findUnique.mockResolvedValue(null);

    let capturedInteractions: any;
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      const mockTx = {
        formSubmission: {
          create: vi.fn().mockResolvedValue({
            id: 5,
            formId: 1,
            sessionId: "session123",
            submittedData: { name: "John Doe" },
            isCompleted: true,
            completedAt: new Date(),
          }),
        },
        session: {
          update: vi.fn().mockImplementation(({ data }) => {
            capturedInteractions = data.interactions;
            return Promise.resolve({});
          }),
        },
      };
      return callback(mockTx);
    });

    const result = await createFormSubmission(request);

    expect(result.submissionId).toBe(5);
    expect(capturedInteractions).toEqual({
      existing_data: "test",
      form_submissions: [
        {
          type: "form_submission",
          formId: 1,
          formName: "Contact Form",
          submissionId: 5,
          isCompleted: true,
          timestamp: expect.any(String),
          submittedData: { name: "John Doe" },
        },
      ],
    });
  });
});