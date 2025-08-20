import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteForm } from "../service/delete.service";
import { getPrisma } from "../../../lib/prisma";
import { UnauthorizedError, BadRequestError, NotFoundError, ForbiddenError } from "../../../errors";

vi.mock("../../../lib/prisma");

const mockGetPrisma = vi.mocked(getPrisma);

describe("Delete Form Service", () => {
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
        delete: vi.fn(),
      },
    };

    mockGetPrisma.mockReturnValue(mockPrisma);
    vi.clearAllMocks();
  });

  it("should delete form successfully without funnel", async () => {
    const userId = 1;
    const formId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      funnelId: null,
    });
    mockPrisma.form.delete.mockResolvedValue({
      id: 1,
    });

    const result = await deleteForm(userId, formId);

    expect(result.message).toBe("The form has been deleted successfully");
    expect(mockPrisma.form.delete).toHaveBeenCalledWith({
      where: { id: formId },
    });
    expect(mockPrisma.funnel.findUnique).not.toHaveBeenCalled();
  });

  it("should delete form successfully with funnel ownership check", async () => {
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
    mockPrisma.form.delete.mockResolvedValue({
      id: 1,
    });

    const result = await deleteForm(userId, formId);

    expect(result.message).toBe("The form has been deleted successfully");
    expect(mockPrisma.funnel.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { userId: true },
    });
    expect(mockPrisma.form.delete).toHaveBeenCalledWith({
      where: { id: formId },
    });
  });

  it("should throw UnauthorizedError when userId is missing", async () => {
    await expect(deleteForm(0, 1)).rejects.toThrow(UnauthorizedError);
  });

  it("should throw BadRequestError when formId is missing", async () => {
    await expect(deleteForm(1, 0)).rejects.toThrow(BadRequestError);
  });

  it("should throw NotFoundError when user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(deleteForm(1, 1)).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when form not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.form.findUnique.mockResolvedValue(null);

    await expect(deleteForm(1, 1)).rejects.toThrow(NotFoundError);
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

    await expect(deleteForm(1, 1)).rejects.toThrow(ForbiddenError);
  });

  it("should handle cascade deletion of submissions", async () => {
    const userId = 1;
    const formId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      funnelId: null,
    });
    mockPrisma.form.delete.mockResolvedValue({
      id: 1,
    });

    const result = await deleteForm(userId, formId);

    expect(result.message).toBe("The form has been deleted successfully");
    expect(mockPrisma.form.delete).toHaveBeenCalledWith({
      where: { id: formId },
    });
  });

  it("should handle form with funnel but funnel not found", async () => {
    const userId = 1;
    const formId = 1;

    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.form.findUnique.mockResolvedValue({
      id: 1,
      funnelId: 999, // Non-existent funnel
    });
    mockPrisma.funnel.findUnique.mockResolvedValue(null);
    mockPrisma.form.delete.mockResolvedValue({
      id: 1,
    });

    const result = await deleteForm(userId, formId);

    expect(result.message).toBe("The form has been deleted successfully");
    expect(mockPrisma.form.delete).toHaveBeenCalledWith({
      where: { id: formId },
    });
  });
});