import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import { getPrisma, setPrismaClient } from "../../lib/prisma";
import { PrismaClient, UserPlan } from "../../generated/prisma-client";
import { getSessionHistory } from "../../services/session/get-history";

describe("Get Session History", () => {
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();

  let userId: number;
  let workspaceId: number;
  let funnelId: number;

  beforeAll(async () => {
    const dbUrl = process.env.DATABASE_URL || "";
    const dbName = dbUrl.split("/").pop()?.split("?")[0];
    console.log(`\n🔧 Running session history tests against database: ${dbName}\n`);
  });

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    try {
      await prisma.formSubmission.deleteMany({});
      await prisma.session.deleteMany({});
      await prisma.page.deleteMany({});
      await prisma.funnel.deleteMany({});
      await prisma.workspaceMember.deleteMany({});
      await prisma.workspace.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.warn("Cleanup error in afterAll:", error);
    }
    await prismaClient.$disconnect();
  });

  beforeEach(async () => {
    // Clear data before each test
    try {
      await prisma.formSubmission.deleteMany({});
      await prisma.session.deleteMany({});
      await prisma.page.deleteMany({});
      await prisma.funnel.deleteMany({});
      await prisma.workspaceMember.deleteMany({});
      await prisma.workspace.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.warn("Cleanup error in beforeEach:", error);
    }

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        password: "$2b$10$hashedpassword",
        verified: true,
        plan: UserPlan.BUSINESS,
      },
    });
    userId = user.id;

    // Create test workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: "Test Workspace",
        slug: "test-workspace",
        ownerId: userId,
      },
    });
    workspaceId = workspace.id;

    // Add user as workspace member with admin role
    await prisma.workspaceMember.create({
      data: {
        userId: userId,
        workspaceId: workspaceId,
        role: "ADMIN",
      },
    });

    // Create test funnel
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
  });

  describe("Basic Functionality", () => {
    it("should return empty sessions list for funnel with no sessions", async () => {
      const result = await getSessionHistory(
        { funnelId, page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.sessions).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.completedSessions).toBe(0);
      expect(result.ctr).toBe(0);
    });

    it("should return sessions without form submissions marked as incomplete", async () => {
      // Create sessions without form submissions
      await prisma.session.create({
        data: {
          sessionId: "session-1",
          funnelId: funnelId,
          visitedPages: [1, 2],
          interactions: {
            page_1: { clicks: 5, timeSpent: 30 },
            page_2: { clicks: 2, timeSpent: 15 },
          },
        },
      });

      await prisma.session.create({
        data: {
          sessionId: "session-2",
          funnelId: funnelId,
          visitedPages: [1],
          interactions: {
            page_1: { clicks: 1, timeSpent: 10 },
          },
        },
      });

      const result = await getSessionHistory(
        { funnelId, page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.sessions).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.completedSessions).toBe(0);
      expect(result.ctr).toBe(0);

      // Both sessions should be incomplete
      result.sessions.forEach((session) => {
        expect(session.isCompleted).toBe(false);
      });
    });

    it("should return sessions with form submissions marked as complete", async () => {
      // Create form for the funnel
      const form = await prisma.form.create({
        data: {
          name: "Contact Form",
          funnelId: funnelId,
          formContent: {
            fields: [
              { id: "name", type: "text", label: "Name", required: true },
              { id: "email", type: "email", label: "Email", required: true },
            ],
          },
        },
      });

      // Create session
      const session = await prisma.session.create({
        data: {
          sessionId: "session-with-submission",
          funnelId: funnelId,
          visitedPages: [1, 2, 3],
          interactions: {
            page_1: { clicks: 5, timeSpent: 30 },
            page_2: { clicks: 3, timeSpent: 20 },
            page_3: { clicks: 1, timeSpent: 45 },
          },
        },
      });

      // Create form submission for this session
      await prisma.formSubmission.create({
        data: {
          formId: form.id,
          sessionId: session.sessionId,
          submittedData: {
            name: "John Doe",
            email: "john@example.com",
          },
          completedAt: new Date(),
        },
      });

      const result = await getSessionHistory(
        { funnelId, page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.sessions).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.completedSessions).toBe(1);
      expect(result.ctr).toBe(100); // 1/1 = 100%
      expect(result.sessions[0].isCompleted).toBe(true);
      expect(result.sessions[0].sessionId).toBe("session-with-submission");
      expect(result.sessions[0].visitedPages).toEqual([1, 2, 3]);
      expect(result.sessions[0].interactions).toEqual({
        page_1: { clicks: 5, timeSpent: 30 },
        page_2: { clicks: 3, timeSpent: 20 },
        page_3: { clicks: 1, timeSpent: 45 },
      });
    });
  });

  describe("CTR Calculation", () => {
    it("should calculate correct CTR with mixed completed and incomplete sessions", async () => {
      const form = await prisma.form.create({
        data: {
          name: "Lead Form",
          funnelId: funnelId,
          formContent: {},
        },
      });

      // Create 10 sessions
      for (let i = 1; i <= 10; i++) {
        const session = await prisma.session.create({
          data: {
            sessionId: `session-${i}`,
            funnelId: funnelId,
            visitedPages: [1],
            interactions: { page_1: { clicks: i } },
          },
        });

        // Only sessions 1-3 have form submissions (30% conversion)
        if (i <= 3) {
          await prisma.formSubmission.create({
            data: {
              formId: form.id,
              sessionId: session.sessionId,
              submittedData: { user: `User ${i}` },
              completedAt: new Date(),
            },
          });
        }
      }

      const result = await getSessionHistory(
        { funnelId, page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.pagination.total).toBe(10);
      expect(result.completedSessions).toBe(3);
      expect(result.ctr).toBe(30); // 3/10 = 30%

      // Verify completion status
      const completedSessions = result.sessions.filter((s) => s.isCompleted);
      const incompleteSessions = result.sessions.filter((s) => !s.isCompleted);

      expect(completedSessions).toHaveLength(3);
      expect(incompleteSessions).toHaveLength(7);
    });

    it("should calculate CTR as 50% for half completed sessions", async () => {
      const form = await prisma.form.create({
        data: {
          name: "Survey Form",
          funnelId: funnelId,
          formContent: {},
        },
      });

      // Create 4 sessions, 2 with submissions
      for (let i = 1; i <= 4; i++) {
        const session = await prisma.session.create({
          data: {
            sessionId: `session-${i}`,
            funnelId: funnelId,
            visitedPages: [1],
            interactions: {},
          },
        });

        if (i <= 2) {
          await prisma.formSubmission.create({
            data: {
              formId: form.id,
              sessionId: session.sessionId,
              submittedData: {},
              completedAt: new Date(),
            },
          });
        }
      }

      const result = await getSessionHistory(
        { funnelId, page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.pagination.total).toBe(4);
      expect(result.completedSessions).toBe(2);
      expect(result.ctr).toBe(50); // 2/4 = 50%
    });

    it("should round CTR to nearest integer", async () => {
      const form = await prisma.form.create({
        data: {
          name: "Test Form",
          funnelId: funnelId,
          formContent: {},
        },
      });

      // Create 3 sessions, 1 with submission (33.33%)
      for (let i = 1; i <= 3; i++) {
        const session = await prisma.session.create({
          data: {
            sessionId: `session-${i}`,
            funnelId: funnelId,
            visitedPages: [1],
            interactions: {},
          },
        });

        if (i === 1) {
          await prisma.formSubmission.create({
            data: {
              formId: form.id,
              sessionId: session.sessionId,
              submittedData: {},
              completedAt: new Date(),
            },
          });
        }
      }

      const result = await getSessionHistory(
        { funnelId, page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.pagination.total).toBe(3);
      expect(result.completedSessions).toBe(1);
      expect(result.ctr).toBe(33); // Math.round(33.33) = 33
    });
  });

  describe("Interaction Data", () => {
    it("should return complete interaction history for each session", async () => {
      await prisma.session.create({
        data: {
          sessionId: "detailed-session",
          funnelId: funnelId,
          visitedPages: [1, 2, 3],
          interactions: {
            page_1: {
              clicks: 10,
              timeSpent: 45,
              scrollDepth: 80,
              events: ["button_click", "video_play"],
            },
            page_2: {
              clicks: 5,
              timeSpent: 30,
              scrollDepth: 100,
              events: ["form_focus"],
            },
            page_3: {
              clicks: 2,
              timeSpent: 15,
              scrollDepth: 50,
              events: [],
            },
          },
        },
      });

      const result = await getSessionHistory(
        { funnelId, page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.sessions).toHaveLength(1);

      const session = result.sessions[0];
      expect(session.interactions).toEqual({
        page_1: {
          clicks: 10,
          timeSpent: 45,
          scrollDepth: 80,
          events: ["button_click", "video_play"],
        },
        page_2: {
          clicks: 5,
          timeSpent: 30,
          scrollDepth: 100,
          events: ["form_focus"],
        },
        page_3: {
          clicks: 2,
          timeSpent: 15,
          scrollDepth: 50,
          events: [],
        },
      });
    });

    it("should handle empty interactions object", async () => {
      await prisma.session.create({
        data: {
          sessionId: "empty-interactions",
          funnelId: funnelId,
          visitedPages: [],
          interactions: {},
        },
      });

      const result = await getSessionHistory(
        { funnelId, page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].interactions).toEqual({});
      expect(result.sessions[0].visitedPages).toEqual([]);
    });
  });

  describe("Multiple Form Submissions", () => {
    it("should mark session as complete if it has multiple form submissions", async () => {
      const form1 = await prisma.form.create({
        data: {
          name: "Form 1",
          funnelId: funnelId,
          formContent: {},
        },
      });

      const form2 = await prisma.form.create({
        data: {
          name: "Form 2",
          funnelId: funnelId,
          formContent: {},
        },
      });

      const session = await prisma.session.create({
        data: {
          sessionId: "multi-submission-session",
          funnelId: funnelId,
          visitedPages: [1, 2],
          interactions: {},
        },
      });

      // Create multiple form submissions for same session
      await prisma.formSubmission.create({
        data: {
          formId: form1.id,
          sessionId: session.sessionId,
          submittedData: { question: "answer1" },
          completedAt: new Date(),
        },
      });

      await prisma.formSubmission.create({
        data: {
          formId: form2.id,
          sessionId: session.sessionId,
          submittedData: { question: "answer2" },
          completedAt: new Date(),
        },
      });

      const result = await getSessionHistory(
        { funnelId, page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].isCompleted).toBe(true);
      expect(result.completedSessions).toBe(1);
      expect(result.ctr).toBe(100);
    });
  });

  describe("Session Ordering", () => {
    it("should return sessions ordered by creation date descending (newest first)", async () => {
      // Create sessions with different timestamps
      await prisma.session.create({
        data: {
          sessionId: "oldest-session",
          funnelId: funnelId,
          visitedPages: [1],
          interactions: {},
          createdAt: new Date("2025-01-01T10:00:00Z"),
        },
      });

      await prisma.session.create({
        data: {
          sessionId: "newest-session",
          funnelId: funnelId,
          visitedPages: [1],
          interactions: {},
          createdAt: new Date("2025-01-03T10:00:00Z"),
        },
      });

      await prisma.session.create({
        data: {
          sessionId: "middle-session",
          funnelId: funnelId,
          visitedPages: [1],
          interactions: {},
          createdAt: new Date("2025-01-02T10:00:00Z"),
        },
      });

      const result = await getSessionHistory(
        { funnelId, page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.sessions).toHaveLength(3);
      expect(result.sessions[0].sessionId).toBe("newest-session");
      expect(result.sessions[1].sessionId).toBe("middle-session");
      expect(result.sessions[2].sessionId).toBe("oldest-session");
    });
  });

  describe("Permission Checks", () => {
    it("should throw error if funnel does not exist", async () => {
      await expect(
        getSessionHistory(
          { funnelId: 99999, page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
          userId
        )
      ).rejects.toThrow("Funnel not found");
    });

    it("should throw error if user does not have permission to view funnel", async () => {
      // Create another user without access
      const otherUser = await prisma.user.create({
        data: {
          email: "other@example.com",
          username: "otheruser",
          firstName: "Other",
          lastName: "User",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.FREE,
        },
      });

      await expect(
        getSessionHistory(
          { funnelId, page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
          otherUser.id
        )
      ).rejects.toThrow("access to this workspace");
    });
  });

  describe("Edge Cases", () => {
    it("should handle session with incomplete form submission (completedAt is null)", async () => {
      const form = await prisma.form.create({
        data: {
          name: "Incomplete Form",
          funnelId: funnelId,
          formContent: {},
        },
      });

      const session = await prisma.session.create({
        data: {
          sessionId: "incomplete-form-session",
          funnelId: funnelId,
          visitedPages: [1],
          interactions: {},
        },
      });

      // Create form submission WITHOUT completedAt (incomplete)
      await prisma.formSubmission.create({
        data: {
          formId: form.id,
          sessionId: session.sessionId,
          submittedData: {},
          completedAt: null, // Not completed
        },
      });

      const result = await getSessionHistory(
        { funnelId, page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      // Session should still be marked as complete (has form submission, regardless of completedAt)
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].isCompleted).toBe(true);
      expect(result.completedSessions).toBe(1);
      expect(result.ctr).toBe(100);
    });

    it("should handle very large interaction objects", async () => {
      const largeInteractions: any = {};
      for (let i = 1; i <= 100; i++) {
        largeInteractions[`page_${i}`] = {
          clicks: i,
          timeSpent: i * 10,
          events: Array(10).fill(`event_${i}`),
        };
      }

      await prisma.session.create({
        data: {
          sessionId: "large-interactions",
          funnelId: funnelId,
          visitedPages: Array.from({ length: 100 }, (_, i) => i + 1),
          interactions: largeInteractions,
        },
      });

      const result = await getSessionHistory(
        { funnelId, page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.sessions).toHaveLength(1);
      expect(Object.keys(result.sessions[0].interactions)).toHaveLength(100);
      expect(result.sessions[0].visitedPages).toHaveLength(100);
    });
  });

  describe("Search Functionality", () => {
    it("should search by sessionId", async () => {
      // Create sessions with different sessionIds
      const session1 = await prisma.session.create({
        data: {
          sessionId: "abc123-unique-session",
          funnelId: funnelId,
          visitedPages: [1],
          interactions: {},
        },
      });

      const session2 = await prisma.session.create({
        data: {
          sessionId: "xyz789-another-session",
          funnelId: funnelId,
          visitedPages: [1],
          interactions: {},
        },
      });

      const result = await getSessionHistory(
        { funnelId, search: "abc123", page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].sessionId).toBe("abc123-unique-session");
      expect(result.pagination.total).toBe(1);
    });

    it("should search in form submission data (name)", async () => {
      const form = await prisma.form.create({
        data: {
          name: "Contact Form",
          funnelId: funnelId,
          formContent: {},
        },
      });

      const session1 = await prisma.session.create({
        data: {
          sessionId: "session-john",
          funnelId: funnelId,
          visitedPages: [1],
          interactions: {
            form_submissions: [
              {
                type: "form_submission",
                formId: form.id,
                formName: "Contact Form",
                submittedData: {
                  name: "John Doe",
                  email: "john@example.com",
                },
              },
            ],
          },
        },
      });

      await prisma.formSubmission.create({
        data: {
          formId: form.id,
          sessionId: session1.sessionId,
          submittedData: { name: "John Doe" },
          completedAt: new Date(),
        },
      });

      const session2 = await prisma.session.create({
        data: {
          sessionId: "session-jane",
          funnelId: funnelId,
          visitedPages: [1],
          interactions: {
            form_submissions: [
              {
                type: "form_submission",
                formId: form.id,
                formName: "Contact Form",
                submittedData: {
                  name: "Jane Smith",
                  email: "jane@example.com",
                },
              },
            ],
          },
        },
      });

      await prisma.formSubmission.create({
        data: {
          formId: form.id,
          sessionId: session2.sessionId,
          submittedData: { name: "Jane Smith" },
          completedAt: new Date(),
        },
      });

      const result = await getSessionHistory(
        { funnelId, search: "John Doe", page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].sessionId).toBe("session-john");
      expect(result.pagination.total).toBe(1);
    });

    it("should search in form submission data (email)", async () => {
      const form = await prisma.form.create({
        data: {
          name: "Contact Form",
          funnelId: funnelId,
          formContent: {},
        },
      });

      const session = await prisma.session.create({
        data: {
          sessionId: "session-with-email",
          funnelId: funnelId,
          visitedPages: [1],
          interactions: {
            form_submissions: [
              {
                type: "form_submission",
                formId: form.id,
                formName: "Contact Form",
                submittedData: {
                  name: "Test User",
                  email: "testuser@mailinator.com",
                },
              },
            ],
          },
        },
      });

      await prisma.formSubmission.create({
        data: {
          formId: form.id,
          sessionId: session.sessionId,
          submittedData: { email: "testuser@mailinator.com" },
          completedAt: new Date(),
        },
      });

      const result = await getSessionHistory(
        { funnelId, search: "mailinator", page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].sessionId).toBe("session-with-email");
    });

    it("should search in insight/quiz submissions", async () => {
      const session = await prisma.session.create({
        data: {
          sessionId: "session-with-quiz",
          funnelId: funnelId,
          visitedPages: [1],
          interactions: {
            insight_submissions: [
              {
                type: "quiz_submission",
                quizId: 1,
                quizName: "Personality Quiz",
                answers: {
                  question1: "Ahmad Naser",
                  question2: "Developer",
                },
              },
            ],
          },
        },
      });

      const result = await getSessionHistory(
        { funnelId, search: "Ahmad Naser", page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].sessionId).toBe("session-with-quiz");
    });

    it("should search in form names", async () => {
      const session = await prisma.session.create({
        data: {
          sessionId: "session-with-contact-form",
          funnelId: funnelId,
          visitedPages: [1],
          interactions: {
            form_submissions: [
              {
                type: "form_submission",
                formId: 1,
                formName: "Newsletter Signup Form",
                submittedData: { email: "user@example.com" },
              },
            ],
          },
        },
      });

      const result = await getSessionHistory(
        { funnelId, search: "Newsletter", page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].sessionId).toBe("session-with-contact-form");
    });

    it("should return empty results when search does not match", async () => {
      await prisma.session.create({
        data: {
          sessionId: "session-no-match",
          funnelId: funnelId,
          visitedPages: [1],
          interactions: {
            form_submissions: [
              {
                type: "form_submission",
                formId: 1,
                formName: "Contact Form",
                submittedData: { name: "John Doe" },
              },
            ],
          },
        },
      });

      const result = await getSessionHistory(
        { funnelId, search: "nonexistent-search-term", page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.sessions).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it("should handle case-insensitive search", async () => {
      const session = await prisma.session.create({
        data: {
          sessionId: "session-case-test",
          funnelId: funnelId,
          visitedPages: [1],
          interactions: {
            form_submissions: [
              {
                type: "form_submission",
                formId: 1,
                formName: "Contact Form",
                submittedData: { name: "Amanda Hampton" },
              },
            ],
          },
        },
      });

      // Search with different case
      const result = await getSessionHistory(
        { funnelId, search: "AMANDA HAMPTON", page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].sessionId).toBe("session-case-test");
    });

    it("should correctly calculate CTR with search results", async () => {
      const form = await prisma.form.create({
        data: {
          name: "Test Form",
          funnelId: funnelId,
          formContent: {},
        },
      });

      // Create 3 sessions with "test" in data
      for (let i = 1; i <= 3; i++) {
        const session = await prisma.session.create({
          data: {
            sessionId: `test-session-${i}`,
            funnelId: funnelId,
            visitedPages: [1],
            interactions: {
              form_submissions: [
                {
                  type: "form_submission",
                  formId: form.id,
                  formName: "Test Form",
                  submittedData: { email: `test${i}@example.com` },
                },
              ],
            },
          },
        });

        // Only first 2 have form submissions (completed)
        if (i <= 2) {
          await prisma.formSubmission.create({
            data: {
              formId: form.id,
              sessionId: session.sessionId,
              submittedData: { email: `test${i}@example.com` },
              completedAt: new Date(),
            },
          });
        }
      }

      const result = await getSessionHistory(
        { funnelId, search: "test", page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
        userId
      );

      expect(result.pagination.total).toBe(3);
      expect(result.completedSessions).toBe(2);
      expect(result.ctr).toBe(67); // 2/3 = 66.67% rounded to 67
    });
  });
});
