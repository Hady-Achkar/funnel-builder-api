import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { getPrisma, setPrismaClient } from "../../lib/prisma";
import { PrismaClient, UserPlan, WorkspaceRole } from "../../generated/prisma-client";
import { deleteFormSubmission } from "../../services/form-submission/delete";

describe("Delete Form Submission Tests", () => {
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();

  console.log("🔧 Running delete form submission tests against database: funnel_builder_test");

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  let userId: number;
  let workspaceId: number;
  let funnelId: number;
  let formId: number;
  let sessionId: string;
  let submissionId: number;

  beforeEach(async () => {
    // Clean up before each test
    await prisma.formSubmission.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.form.deleteMany({});
    await prisma.funnel.deleteMany({});
    await prisma.workspaceMember.deleteMany({});
    await prisma.workspace.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: "owner@test.com",
        username: "testowner",
        firstName: "Test",
        lastName: "Owner",
        password: "$2b$10$hashedpassword",
        verified: true,
        plan: UserPlan.AGENCY,
      },
    });
    userId = user.id;

    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: userId,
      },
    });
    workspaceId = workspace.id;

    // Add user as workspace member
    await prisma.workspaceMember.create({
      data: {
        userId: userId,
        workspaceId: workspaceId,
        role: WorkspaceRole.OWNER,
      },
    });

    // Create funnel
    const funnel = await prisma.funnel.create({
      data: {
        name: "Test Funnel",
        slug: "test-funnel",
        creator: {
          connect: { id: userId },
        },
        workspace: {
          connect: { id: workspaceId },
        },
      },
    });
    funnelId = funnel.id;

    // Create form
    const form = await prisma.form.create({
      data: {
        name: "Contact Form",
        funnelId: funnelId,
        formContent: {},
      },
    });
    formId = form.id;

    // Create session initially without interactions
    const session = await prisma.session.create({
      data: {
        sessionId: "test-session-id",
        funnelId: funnelId,
        visitedPages: [1],
        interactions: {},
      },
    });
    sessionId = session.sessionId;

    // Create form submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId: formId,
        sessionId: sessionId,
        submittedData: {
          name: "John Doe",
          email: "john@example.com",
        },
        completedAt: new Date(),
      },
    });
    submissionId = submission.id;

    // Now update session with interactions using the actual submission ID
    await prisma.session.update({
      where: { sessionId },
      data: {
        interactions: {
          form_submissions: [
            {
              type: "form_submission",
              formId: formId,
              formName: "Contact Form",
              submissionId: submissionId,
              timestamp: new Date().toISOString(),
              submittedData: {
                name: "John Doe",
                email: "john@example.com",
              },
            },
          ],
        },
      },
    });
  });

  describe("Successful Deletion", () => {
    it("should successfully delete form submission as owner", async () => {
      const result = await deleteFormSubmission(userId, { submissionId });

      expect(result.message).toBe("Form submission deleted successfully");

      // Verify submission is deleted from database
      const deletedSubmission = await prisma.formSubmission.findUnique({
        where: { id: submissionId },
      });
      expect(deletedSubmission).toBeNull();

      // Verify session interactions are updated
      const updatedSession = await prisma.session.findUnique({
        where: { sessionId },
        select: { interactions: true },
      });

      const interactions = updatedSession?.interactions as any;
      expect(interactions.form_submissions).toEqual([]);
    });

    it("should successfully delete form submission as admin", async () => {
      // Create admin user
      const adminUser = await prisma.user.create({
        data: {
          email: "admin@test.com",
          username: "testadmin",
          firstName: "Test",
          lastName: "Admin",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.FREE,
        },
      });

      // Add as workspace admin
      await prisma.workspaceMember.create({
        data: {
          userId: adminUser.id,
          workspaceId: workspaceId,
          role: WorkspaceRole.ADMIN,
        },
      });

      const result = await deleteFormSubmission(adminUser.id, { submissionId });

      expect(result.message).toBe("Form submission deleted successfully");

      const deletedSubmission = await prisma.formSubmission.findUnique({
        where: { id: submissionId },
      });
      expect(deletedSubmission).toBeNull();
    });

    it("should successfully delete form submission as editor with DELETE_FUNNELS permission", async () => {
      // Create editor user
      const editorUser = await prisma.user.create({
        data: {
          email: "editor@test.com",
          username: "testeditor",
          firstName: "Test",
          lastName: "Editor",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.FREE,
        },
      });

      // Add as workspace editor with DELETE_FUNNELS permission
      await prisma.workspaceMember.create({
        data: {
          userId: editorUser.id,
          workspaceId: workspaceId,
          role: WorkspaceRole.EDITOR,
          permissions: ["DELETE_FUNNELS"],
        },
      });

      const result = await deleteFormSubmission(editorUser.id, { submissionId });

      expect(result.message).toBe("Form submission deleted successfully");

      const deletedSubmission = await prisma.formSubmission.findUnique({
        where: { id: submissionId },
      });
      expect(deletedSubmission).toBeNull();
    });

    it("should update session interactions correctly when deleting submission", async () => {
      // Create a second form (FormSubmission has unique constraint on formId + sessionId)
      const form2 = await prisma.form.create({
        data: {
          name: "Newsletter Form",
          funnelId: funnelId,
          formContent: {},
        },
      });

      // Create another submission for different form
      const submission2 = await prisma.formSubmission.create({
        data: {
          formId: form2.id,
          sessionId: sessionId,
          submittedData: {
            email: "jane@example.com",
          },
          completedAt: new Date(),
        },
      });

      // Update session with both form submissions
      await prisma.session.update({
        where: { sessionId },
        data: {
          interactions: {
            form_submissions: [
              {
                type: "form_submission",
                formId: formId,
                formName: "Contact Form",
                submissionId: submissionId,
                timestamp: new Date().toISOString(),
                submittedData: { name: "John Doe" },
              },
              {
                type: "form_submission",
                formId: form2.id,
                formName: "Newsletter Form",
                submissionId: submission2.id,
                timestamp: new Date().toISOString(),
                submittedData: { email: "jane@example.com" },
              },
            ],
          },
        },
      });

      // Delete first submission
      await deleteFormSubmission(userId, { submissionId });

      // Verify only second submission remains in interactions
      const updatedSession = await prisma.session.findUnique({
        where: { sessionId },
        select: { interactions: true },
      });

      const interactions = updatedSession?.interactions as any;
      expect(interactions.form_submissions).toHaveLength(1);
      expect(interactions.form_submissions[0].submissionId).toBe(submission2.id);
      expect(interactions.form_submissions[0].formName).toBe("Newsletter Form");
    });
  });

  describe("Permission Failures", () => {
    it("should fail when editor does not have DELETE_FUNNELS permission", async () => {
      // Create editor user without DELETE_FUNNELS permission
      const editorUser = await prisma.user.create({
        data: {
          email: "editor2@test.com",
          username: "testeditor2",
          firstName: "Test",
          lastName: "Editor",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.FREE,
        },
      });

      // Add as workspace editor without DELETE_FUNNELS permission
      await prisma.workspaceMember.create({
        data: {
          userId: editorUser.id,
          workspaceId: workspaceId,
          role: WorkspaceRole.EDITOR,
          permissions: ["EDIT_PAGES"], // Only has EDIT_PAGES
        },
      });

      await expect(
        deleteFormSubmission(editorUser.id, { submissionId })
      ).rejects.toThrow(
        "You don't have permission to delete form submissions. Only workspace owners, admins, and editors with delete permissions can perform this action."
      );
    });

    it("should fail when user is a viewer", async () => {
      // Create viewer user
      const viewerUser = await prisma.user.create({
        data: {
          email: "viewer@test.com",
          username: "testviewer",
          firstName: "Test",
          lastName: "Viewer",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.FREE,
        },
      });

      // Add as workspace viewer
      await prisma.workspaceMember.create({
        data: {
          userId: viewerUser.id,
          workspaceId: workspaceId,
          role: WorkspaceRole.VIEWER,
        },
      });

      await expect(
        deleteFormSubmission(viewerUser.id, { submissionId })
      ).rejects.toThrow(
        "You don't have permission to delete form submissions. Only workspace owners, admins, and editors with delete permissions can perform this action."
      );
    });

    it("should fail when user is not a workspace member", async () => {
      // Create non-member user
      const nonMemberUser = await prisma.user.create({
        data: {
          email: "nonmember@test.com",
          username: "testnonmember",
          firstName: "Test",
          lastName: "NonMember",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.FREE,
        },
      });

      await expect(
        deleteFormSubmission(nonMemberUser.id, { submissionId })
      ).rejects.toThrow("permission");
    });
  });

  describe("Not Found Errors", () => {
    it("should fail when submission does not exist", async () => {
      await expect(
        deleteFormSubmission(userId, { submissionId: 99999 })
      ).rejects.toThrow("Form submission not found");
    });

    it("should fail when submission exists but form is deleted", async () => {
      // Delete the form (cascades to submission)
      await prisma.form.delete({
        where: { id: formId },
      });

      await expect(
        deleteFormSubmission(userId, { submissionId })
      ).rejects.toThrow("Form submission not found");
    });
  });

  describe("Edge Cases", () => {
    it("should handle deletion when session has no form_submissions in interactions", async () => {
      // Update session to have empty interactions
      await prisma.session.update({
        where: { sessionId },
        data: {
          interactions: {},
        },
      });

      const result = await deleteFormSubmission(userId, { submissionId });

      expect(result.message).toBe("Form submission deleted successfully");

      // Verify submission is deleted
      const deletedSubmission = await prisma.formSubmission.findUnique({
        where: { id: submissionId },
      });
      expect(deletedSubmission).toBeNull();
    });

    it("should handle deletion when session interactions has form_submissions but submission is not in array", async () => {
      // Update session with different submission
      await prisma.session.update({
        where: { sessionId },
        data: {
          interactions: {
            form_submissions: [
              {
                type: "form_submission",
                formId: formId,
                formName: "Contact Form",
                submissionId: 9999, // Different ID
                timestamp: new Date().toISOString(),
                submittedData: { name: "Other User" },
              },
            ],
          },
        },
      });

      const result = await deleteFormSubmission(userId, { submissionId });

      expect(result.message).toBe("Form submission deleted successfully");

      // Verify the other submission remains
      const updatedSession = await prisma.session.findUnique({
        where: { sessionId },
        select: { interactions: true },
      });

      const interactions = updatedSession?.interactions as any;
      expect(interactions.form_submissions).toHaveLength(1);
      expect(interactions.form_submissions[0].submissionId).toBe(9999);
    });
  });
});
