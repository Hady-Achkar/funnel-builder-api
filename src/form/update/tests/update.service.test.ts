import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateForm } from "../service/update.service";
import { getPrisma } from "../../../lib/prisma";
import { UnauthorizedError, BadRequestError, NotFoundError, ForbiddenError } from "../../../errors";

vi.mock("../../../lib/prisma");

const mockGetPrisma = vi.mocked(getPrisma);

describe("Update Form Service", () => {
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
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    mockGetPrisma.mockReturnValue(mockPrisma);
    vi.clearAllMocks();
  });

  it("should update form successfully with all fields", async () => {
    const request = {
      name: "Updated Form",
      description: "Updated Description",
      formContent: { field1: "updated" },
      isActive: false,
    };
    const userId = 1;
    const formId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      funnelId: null,
    });
    mockPrisma.form.update.mockResolvedValue({
      id: 1,
      name: "Updated Form",
      description: "Updated Description",
      formContent: { field1: "updated" },
      isActive: false,
    });

    const result = await updateForm(userId, formId, request);

    expect(result.message).toBe("Form updated successfully");
    expect(mockPrisma.form.update).toHaveBeenCalledWith({
      where: { id: formId },
      data: {
        name: "Updated Form",
        description: "Updated Description",
        formContent: { field1: "updated" },
        isActive: false,
      },
    });
  });

  it("should update form with partial fields", async () => {
    const request = {
      name: "Updated Name Only",
    };
    const userId = 1;
    const formId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      funnelId: null,
    });
    mockPrisma.form.update.mockResolvedValue({
      id: 1,
      name: "Updated Name Only",
    });

    const result = await updateForm(userId, formId, request);

    expect(result.message).toBe("Form updated successfully");
    expect(mockPrisma.form.update).toHaveBeenCalledWith({
      where: { id: formId },
      data: {
        name: "Updated Name Only",
      },
    });
  });

  it("should update form with funnel ownership check", async () => {
    const request = {
      name: "Updated Form",
    };
    const userId = 1;
    const formId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      funnelId: 1,
    });
    mockPrisma.funnel.findUnique.mockResolvedValue({
      userId: 1,
    });
    mockPrisma.form.update.mockResolvedValue({
      id: 1,
      name: "Updated Form",
    });

    const result = await updateForm(userId, formId, request);

    expect(result.message).toBe("Form updated successfully");
    expect(mockPrisma.funnel.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { userId: true },
    });
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    await expect(updateForm(0, 1, { name: "Test" })).rejects.toThrow(UnauthorizedError);
  });

  it("should throw BadRequestError when formId is missing", async () => {
    await expect(updateForm(1, 0, { name: "Test" })).rejects.toThrow(BadRequestError);
  });

  it("should throw BadRequestError when no fields to update", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    
    await expect(updateForm(1, 1, {})).rejects.toThrow(BadRequestError);
  });

  it("should throw NotFoundError when user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(updateForm(1, 1, { name: "Test" })).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when form not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.form.findUnique.mockResolvedValue(null);

    await expect(updateForm(1, 1, { name: "Test" })).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when form belongs to another user's funnel", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      funnelId: 1,
    });
    mockPrisma.funnel.findUnique.mockResolvedValue({
      userId: 2, // Different user
    });

    await expect(updateForm(1, 1, { name: "Test" })).rejects.toThrow(ForbiddenError);
  });

  it("should handle null description correctly", async () => {
    const request = {
      description: null,
    };
    const userId = 1;
    const formId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      funnelId: null,
    });
    mockPrisma.form.update.mockResolvedValue({
      id: 1,
      description: null,
    });

    const result = await updateForm(userId, formId, request);

    expect(result.message).toBe("Form updated successfully");
    expect(mockPrisma.form.update).toHaveBeenCalledWith({
      where: { id: formId },
      data: {
        description: null,
      },
    });
  });

  it("should filter out undefined values", async () => {
    const request = {
      name: "Updated Name",
      description: undefined,
      isActive: true,
    };
    const userId = 1;
    const formId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      funnelId: null,
    });
    mockPrisma.form.update.mockResolvedValue({
      id: 1,
      name: "Updated Name",
      isActive: true,
    });

    const result = await updateForm(userId, formId, request);

    expect(result.message).toBe("Form updated successfully");
    expect(mockPrisma.form.update).toHaveBeenCalledWith({
      where: { id: formId },
      data: {
        name: "Updated Name",
        isActive: true,
      },
    });
  });
});