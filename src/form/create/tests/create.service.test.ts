import { describe, it, expect, vi, beforeEach } from "vitest";
import { createForm } from "../service/create.service";
import { getPrisma } from "../../../lib/prisma";
import { UnauthorizedError, BadRequestError, NotFoundError, ForbiddenError } from "../../../errors";

vi.mock("../../../lib/prisma");

const mockGetPrisma = vi.mocked(getPrisma);

describe("Create Form Service", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      funnel: {
        findUnique: vi.fn(),
      },
      form: {
        create: vi.fn(),
      },
    };

    mockGetPrisma.mockReturnValue(mockPrisma);
    vi.clearAllMocks();
  });

  it("should create form successfully without funnelId", async () => {
    const request = {
      name: "Test Form",
      description: "Test Description",
      formContent: { field1: "value1" },
      isActive: true,
    };
    const userId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.form.create.mockResolvedValue({
      id: 1,
      name: "Test Form",
      description: "Test Description",
      formContent: { field1: "value1" },
      isActive: true,
      funnelId: null,
      submissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createForm(userId, request);

    expect(result.message).toBe("Form created successfully");
    expect(result.formId).toBe(1);
    expect(mockPrisma.form.create).toHaveBeenCalledWith({
      data: {
        name: "Test Form",
        description: "Test Description",
        formContent: { field1: "value1" },
        isActive: true,
        funnelId: undefined,
      },
      include: {
        submissions: {
          take: 0,
        },
      },
    });
  });

  it("should create form successfully with funnelId", async () => {
    const request = {
      name: "Test Form",
      description: "Test Description",
      formContent: { field1: "value1" },
      isActive: true,
      funnelId: 1,
    };
    const userId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.funnel.findUnique.mockResolvedValue({ id: 1, userId: 1 });
    mockPrisma.form.create.mockResolvedValue({
      id: 1,
      name: "Test Form",
      description: "Test Description",
      formContent: { field1: "value1" },
      isActive: true,
      funnelId: 1,
      submissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createForm(userId, request);

    expect(result.message).toBe("Form created successfully");
    expect(result.formId).toBe(1);
    expect(mockPrisma.funnel.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true, userId: true },
    });
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    await expect(createForm(0, { 
      name: "Test Form",
      formContent: { field1: "value1" },
    })).rejects.toThrow(UnauthorizedError);
  });

  it("should throw NotFoundError when user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(createForm(1, { 
      name: "Test Form",
      formContent: { field1: "value1" },
    })).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when funnel not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.funnel.findUnique.mockResolvedValue(null);

    await expect(createForm(1, { 
      name: "Test Form",
      formContent: { field1: "value1" },
      funnelId: 999,
    })).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when funnel belongs to another user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.funnel.findUnique.mockResolvedValue({ id: 1, userId: 2 }); // Different user

    await expect(createForm(1, { 
      name: "Test Form",
      formContent: { field1: "value1" },
      funnelId: 1,
    })).rejects.toThrow(ForbiddenError);
  });

  it("should throw BadRequestError for invalid data", async () => {
    await expect(createForm(1, { 
      name: "", // Empty name
      formContent: { field1: "value1" },
    })).rejects.toThrow(BadRequestError);
  });

  it("should handle optional fields correctly", async () => {
    const request = {
      name: "Test Form",
      formContent: { field1: "value1" },
      // No description, isActive defaults to true
    };
    const userId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.form.create.mockResolvedValue({
      id: 1,
      name: "Test Form",
      description: null,
      formContent: { field1: "value1" },
      isActive: true,
      funnelId: null,
      submissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createForm(userId, request);

    expect(result.message).toBe("Form created successfully");
    expect(result.formId).toBe(1);
  });
});