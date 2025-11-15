# Architecture Guide & Route Tracking

## 🎯 IMPORTANT: Read This First

This document defines the architecture standards for the Funnel Builder API. All code must follow these patterns.
Claude AI must read this file before working on any route or feature.

---

## 📁 File Structure Standards

### 1. Types

**Location**: `src/types/{modelName}/{functionName}/index.ts`

**Rules**:

- **Use ONLY Zod schemas** - All types must be Zod schemas
- **Import Prisma types for enums only** - Use inside `z.nativeEnum()`
- **Export Zod schemas first, then inferred types**
- **NEVER use `any` or `unknown` types**
- **NEVER use Prisma Pick types directly** - Use Zod schemas instead
- **Separate request and response schemas**

**Example**:

```typescript
// src/types/workspace/create/index.ts
import { z } from "zod";
import { WorkspaceStatus } from "../../../generated/prisma-client";

// Define schemas first
export const createWorkspaceRequestSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  status: z.nativeEnum(WorkspaceStatus).default(WorkspaceStatus.ACTIVE),
});

export const createWorkspaceResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.date(),
  message: z.string(),
});

// Export inferred types from schemas
export type CreateWorkspaceRequest = z.infer<
  typeof createWorkspaceRequestSchema
>;
export type CreateWorkspaceResponse = z.infer<
  typeof createWorkspaceResponseSchema
>;

// For backward compatibility (optional)
export const createWorkspaceRequest = createWorkspaceRequestSchema;
```

### 2. Services

**Location**: `src/services/{modelName}/{functionName}/index.ts`

**Responsibilities**:

- Database operations (CRUD)
- Data transformations
- Business logic calculations
- NO validation (that's controller's job)
- NO HTTP concerns (status codes, etc.)
- Try-catch blocks for error handling
- Prisma calls ONLY at service level

**Utils**: Place helper functions in `src/services/{modelName}/{functionName}/utils/{utilName}.ts`

- NO Prisma calls in utils
- Accept processed data as parameters
- Return calculated/transformed values
- Pure functions when possible

**Example**:

```typescript
// src/services/workspace/create/index.ts
import { getPrisma } from "../../../lib/prisma";
import {
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
} from "../../../types/workspace/create";
import { generateSlug } from "./utils/generate-slug";

export class CreateWorkspaceService {
  static async create(
    userId: number,
    data: CreateWorkspaceRequest
  ): Promise<CreateWorkspaceResponse> {
    const prisma = getPrisma();
    const slug = generateSlug(data.name);

    const workspace = await prisma.workspace.create({
      data: {
        ...data,
        slug,
        ownerId: userId,
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      createdAt: workspace.createdAt,
      message: "Workspace created successfully",
    };
  }
}
```

### 3. Controllers

**Location**: `src/controllers/{modelName}/{functionName}/index.ts`

**Responsibilities**:

- Request validation with Zod (parse and catch ZodError)
- Authentication/authorization checks
- Edge case validation (e.g., checking limits)
- HTTP response handling (status codes)
- Main try-catch block for error handling
- Using `return next(error)` for proper Express error handling
- **Always use user-friendly, non-technical error messages**
- **Guide users with clear, helpful error messages**

**Utils**: Place helper functions in `src/controllers/{modelName}/{functionName}/utils/{utilName}.ts`

- NO try-catch blocks in utils
- NO Prisma calls in utils
- Return validation results or null/boolean
- Accept required data as parameters
- Controller decides what error to throw based on util results

**Example**:

```typescript
// src/controllers/workspace/create/index.ts
import { Request, Response, NextFunction } from "express";
import { createWorkspaceRequest } from "../../../types/workspace/create";
import { CreateWorkspaceService } from "../../../services/workspace/create";
import { checkWorkspaceLimit } from "./utils/check-workspace-limit";

export class CreateWorkspaceController {
  static async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. Validate request
      const validatedData = createWorkspaceRequest.parse(req.body);

      // 2. Check edge cases
      const canCreate = await checkWorkspaceLimit(req.userId);
      if (!canCreate) {
        res.status(403).json({
          error: "Workspace limit reached for your plan",
        });
        return;
      }

      // 3. Call service
      const result = await CreateWorkspaceService.create(
        req.userId,
        validatedData
      );

      // 4. Send response
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
```

### 4. Tests

**Location**: `src/test/{modelName}/{functionName}.test.ts`

**CRITICAL: Testing Standards & Safety**

See [TESTING.md](TESTING.md) for comprehensive testing documentation.

#### 4.1 Testing Approach: Unit Tests with Mocked Prisma (REQUIRED)

**REQUIRED PATTERN**: All tests MUST mock Prisma. Integration tests with real databases are discouraged.

**Why Mock Prisma?**

- ✅ Fast execution (no I/O)
- ✅ No database setup required
- ✅ Complete isolation
- ✅ Zero production data risk
- ✅ Tests business logic, not database functionality

**Example**:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getPrisma } from "../../lib/prisma";
import { MyController } from "../../controllers/my-controller";

// REQUIRED: Mock Prisma module
vi.mock("../../lib/prisma");

describe("MyController", () => {
  let mockPrisma: any;

  beforeEach(() => {
    // Create mock Prisma client
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      workspace: {
        findMany: vi.fn(),
      },
    };

    // Make getPrisma() return our mock
    (getPrisma as any).mockReturnValue(mockPrisma);
  });

  describe("Validation", () => {
    it("should reject invalid slug format", async () => {
      // Test validation logic with mocked responses
    });
  });

  describe("Authorization", () => {
    it("should reject unauthenticated requests", async () => {
      // Test auth logic with mocked responses
    });
  });

  describe("Success Cases", () => {
    it("should create workspace with valid data", async () => {
      // Arrange: Setup mock responses
      mockPrisma.workspace.create.mockResolvedValue({
        id: 1,
        name: "Test",
      });

      // Act: Call controller
      const result = await controller.create(mockReq, mockRes, mockNext);

      // Assert: Verify behavior
      expect(mockPrisma.workspace.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: "Test" }),
      });
    });
  });
});
```

#### 4.2 Test Coverage Requirements

- Test all validation rules (Zod schema edge cases)
- Test authorization/authentication scenarios
- Test success cases with various inputs
- Test error handling paths
- Use descriptive test names that explain the scenario
- Group related tests with `describe()` blocks

#### 4.3 Production Data Safety

**CRITICAL PROTECTION MECHANISMS**:

1. **Automatic Database Validation**: [src/test/test-safety-guard.ts](src/test/test-safety-guard.ts)

   - Validates database name contains "test"
   - Blocks production database names (ds-dev, ds-prod, funnel_builder)
   - Runs automatically before EVERY test execution

2. **Environment Isolation**: [vitest.config.ts](vitest.config.ts)

   - Loads `.env.test` with `override: true`
   - Runs safety checks at config level
   - Forces NODE_ENV=test

3. **Prisma Protection**: [src/lib/prisma.ts](src/lib/prisma.ts)

   - Throws error if `getPrisma()` called in test mode without setup
   - Forces explicit mock or `setPrismaClient()` call

4. **Pre-Test Checks**: [package.json](package.json)
   - Verifies `.env.test` exists before running tests
   - Fails fast if configuration is missing

**Result**: Multiple layers of protection ensure tests NEVER connect to production databases.

#### 4.4 Integration Tests (Use Only If Absolutely Necessary)

**Discouraged**: Only use for complex workflows that genuinely require real database.

**If you must use integration tests**:

```typescript
import { PrismaClient } from "../../generated/prisma-client";
import { getPrisma, setPrismaClient } from "../../lib/prisma";

describe("Complex Integration Test", () => {
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();

  beforeAll(async () => {
    // Safety check - log which database is being used
    const dbUrl = process.env.DATABASE_URL || "";
    const dbName = dbUrl.split("/").pop()?.split("?")[0];
    console.log(`🧪 Running tests against database: ${dbName}`);
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.payment.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    // Final cleanup and disconnect
    await prisma.$disconnect();
  });

  it("should perform complex workflow", async () => {
    // Test with real database
  });
});
```

**Note**: Integration tests are automatically protected by safety guards but are slower and require database setup.

#### 4.5 External Service Mocking

**ALWAYS mock external APIs**:

```typescript
// Mock Cloudflare API
vi.mock("../../../api/cloudflare");

// Mock SendGrid
vi.mock("@sendgrid/mail");

// Mock Axios for payment providers
vi.mock("axios");
```

**Never make real API calls in tests** - they're slow, unreliable, and may have side effects.

---

## 🚦 Route Migration Tracking

### Status Legend

- ❌ TODO - Needs refactoring to new architecture
- ✅ DONE - Follows new architecture
- 🚧 WIP - Work in progress

---

## 📋 Routes by Model

### Auth Routes (9 routes)

| Method | Path                        | Controller                                    | Status  |
| ------ | --------------------------- | --------------------------------------------- | ------- |
| POST   | `/api/auth/register`        | RegisterController.register                   | ✅ DONE |
| POST   | `/api/auth/login`           | LoginController.login                         | ❌ TODO |
| POST   | `/api/auth/verify`          | verifyEmailController                         | ❌ TODO |
| POST   | `/api/auth/forgot-password` | forgotPasswordController                      | ❌ TODO |
| POST   | `/api/auth/reset-password`  | resetPasswordController                       | ❌ TODO |
| POST   | `/api/auth/logout`          | LogoutController.logout                       | ❌ TODO |
| GET    | `/api/auth/user/profile`    | GetUserDataController.getUserData             | ❌ TODO |
| PUT    | `/api/auth/user/profile`    | UpdateUserProfileController.updateUserProfile | ❌ TODO |

### Workspace Routes (12 routes)

| Method | Path                                        | Controller                                  | Status  |
| ------ | ------------------------------------------- | ------------------------------------------- | ------- |
| POST   | `/api/workspace`                            | CreateWorkspaceController.create            | ❌ TODO |
| GET    | `/api/workspace`                            | getAllWorkspacesController                  | ❌ TODO |
| GET    | `/api/workspace/summary/:workspaceSlug`     | getWorkspaceFunnelsSummaryController        | ❌ TODO |
| GET    | `/api/workspace/:slug`                      | GetWorkspaceController.getBySlug            | ❌ TODO |
| PATCH  | `/api/workspace/configure`                  | ConfigureWorkspaceController.configure      | ❌ TODO |
| PUT    | `/api/workspace/:slug`                      | UpdateWorkspaceController.update            | ❌ TODO |
| POST   | `/api/workspace/invite-member/:slug`        | InviteMemberController.inviteMember         | ❌ TODO |
| POST   | `/api/workspace/accept-invitation`          | AcceptInvitationController.acceptInvitation | ❌ TODO |
| GET    | `/api/workspace/generate-invite-link/:slug` | GenerateInviteLinkController.generateLink   | ❌ TODO |
| POST   | `/api/workspace/join-by-link`               | JoinByLinkController.joinByLink             | ❌ TODO |
| POST   | `/api/workspace/:slug/leave`                | LeaveWorkspaceController.leave              | ❌ TODO |
| DELETE | `/api/workspace/:slug`                      | DeleteWorkspaceController.deleteBySlug      | ❌ TODO |

### Funnel Routes (8 routes)

| Method | Path                                          | Controller                    | Status  |
| ------ | --------------------------------------------- | ----------------------------- | ------- |
| POST   | `/api/funnel`                                 | createFunnelController        | ❌ TODO |
| POST   | `/api/funnel/from-template/:templateId`       | createFromTemplateController  | ✅ DONE |
| POST   | `/api/funnel/:id/duplicate`                   | duplicateFunnelController     | ✅ DONE |
| GET    | `/api/funnel/workspace/:workspaceSlug/public` | getPublicFunnelPageController | ❌ TODO |
| GET    | `/api/funnel/workspace/:workspaceSlug`        | getAllFunnelsController       | ❌ TODO |
| GET    | `/api/funnel/:id`                             | getFunnelController           | ❌ TODO |
| PUT    | `/api/funnel/:id`                             | updateFunnelController        | ❌ TODO |
| DELETE | `/api/funnel/:id`                             | deleteFunnelController        | ✅ DONE |

### Page Routes (9 routes)

| Method | Path                                              | Controller                   | Status  | Middleware        |
| ------ | ------------------------------------------------- | ---------------------------- | ------- | ----------------- |
| POST   | `/api/page/funnels/:funnelId`                     | createPageController         | ❌ TODO |                   |
| PUT    | `/api/page/funnels/:funnelId/reorder`             | updatePageOrderController    | ❌ TODO |                   |
| GET    | `/api/page/:id`                                   | getPageController            | ❌ TODO |                   |
| PUT    | `/api/page/:id`                                   | updatePageController         | ❌ TODO |                   |
| DELETE | `/api/page/:id`                                   | deletePageController         | ❌ TODO |                   |
| POST   | `/api/page/:pageId/duplicate`                     | duplicatePageController      | ❌ TODO |                   |
| GET    | `/api/page/funnel/:funnelId/page-by-link/:linkId` | getPageByLinkingIdController | ❌ TODO |                   |
| GET    | `/api/page/funnel/:funnelSlug/page/:linkingId?hostname=required` | getPublicPageController | ✅ DONE | checkFunnelAccess |
| POST   | `/api/page/:pageId/visit`                         | createPageVisitController    | ❌ TODO |                   |

**Note**: The `/api/page/funnel/:funnelSlug/page/:linkingId?hostname=X` endpoint requires the `hostname` query parameter to identify the correct funnel, as multiple funnels across different workspaces may share the same slug. The endpoint verifies that the domain is either owned by the workspace or connected to the funnel via `FunnelDomain` with `isActive=true`. The page data is fetched directly from the database (no caching) to ensure accuracy.

### Site Routes (1 route)

| Method | Path                | Controller                            | Status  | Middleware        |
| ------ | ------------------- | ------------------------------------- | ------- | ----------------- |
| GET    | `/api/sites/public` | GetPublicSiteController.getPublicSite | ✅ DONE | checkFunnelAccess |

**Note**: The `/api/sites/public?hostname=X` endpoint uses the `checkFunnelAccess` middleware to enforce password protection. When a funnel is password-protected, visitors must verify the password via `/api/funnel-settings/verify-password?hostname=X&funnelSlug=Y` before accessing the site data.

### Domain Routes (7 routes)

| Method | Path                                           | Controller                                   | Status  |
| ------ | ---------------------------------------------- | -------------------------------------------- | ------- |
| POST   | `/api/domain/subdomain`                        | CreateSubdomainController.create             | ✅ DONE |
| POST   | `/api/domain/custom`                           | CreateCustomDomainController.create          | ✅ DONE |
| DELETE | `/api/domain/:id`                              | DeleteDomainController.delete                | ✅ DONE |
| POST   | `/api/domain/verify/:id`                       | VerifyDomainController.verify                | ✅ DONE |
| GET    | `/api/domain/workspace/:workspaceId`           | GetAllDomainsController.getAll               | ✅ DONE |
| GET    | `/api/domain/workspace-summary/:workspaceSlug` | getWorkspaceDomainsSummaryController         | ✅ DONE |
| GET    | `/api/domain/:id/dns-instructions`             | GetDnsInstructionsController.getInstructions | ✅ DONE |

### Domain-Funnel Connection Routes (3 routes)

| Method | Path                                          | Controller                        | Status  |
| ------ | --------------------------------------------- | --------------------------------- | ------- |
| POST   | `/api/domain-funnel/connect`                  | ConnectController.connect         | ❌ TODO |
| GET    | `/api/domain-funnel/:funnelId/connections`    | getConnectionsController          | ❌ TODO |
| GET    | `/api/domain-funnel/workspace/:workspaceSlug` | getWorkspaceConnectionsController | ❌ TODO |

### Template Routes (6 routes)

| Method | Path                        | Controller                | Status  |
| ------ | --------------------------- | ------------------------- | ------- |
| GET    | `/api/template`             | getAllTemplatesController | ❌ TODO |
| GET    | `/api/template/:id`         | getTemplateByIdController | ❌ TODO |
| POST   | `/api/template`             | createTemplateController  | ❌ TODO |
| POST   | `/api/template/from-funnel` | createTemplateController  | ❌ TODO |
| PUT    | `/api/template/:id`         | updateTemplateController  | ❌ TODO |
| DELETE | `/api/template/:id`         | deleteTemplateController  | ❌ TODO |

### Form Routes (4 routes)

| Method | Path                                  | Controller                 | Status  |
| ------ | ------------------------------------- | -------------------------- | ------- |
| POST   | `/api/form`                           | createFormController       | ❌ TODO |
| PUT    | `/api/form/:id`                       | updateFormController       | ❌ TODO |
| DELETE | `/api/form/:id`                       | deleteFormController       | ❌ TODO |
| PUT    | `/api/form/webhook/:formId/configure` | configureWebhookController | ❌ TODO |

### Form Submission Routes (2 routes)

| Method | Path                             | Controller                      | Status  |
| ------ | -------------------------------- | ------------------------------- | ------- |
| POST   | `/api/form-submission`           | createFormSubmissionController  | ❌ TODO |
| GET    | `/api/form-submission/:funnelId` | getAllFormSubmissionsController | ❌ TODO |

### Insight Routes (3 routes)

| Method | Path               | Controller              | Status  |
| ------ | ------------------ | ----------------------- | ------- |
| POST   | `/api/insight`     | createInsightController | ❌ TODO |
| PUT    | `/api/insight/:id` | updateInsightController | ❌ TODO |
| DELETE | `/api/insight/:id` | deleteInsightController | ❌ TODO |

### Insight Submission Routes (2 routes)

| Method | Path                                | Controller                         | Status  |
| ------ | ----------------------------------- | ---------------------------------- | ------- |
| POST   | `/api/insight-submission`           | createInsightSubmissionController  | ❌ TODO |
| GET    | `/api/insight-submission/:funnelId` | getAllInsightSubmissionsController | ❌ TODO |

### Session Routes (2 routes)

| Method | Path                                                   | Controller                     | Status  |
| ------ | ------------------------------------------------------ | ------------------------------ | ------- |
| GET    | `/api/sessions/:workspaceSlug/:funnelSlug`             | getSessionsByFunnelController  | ✅ DONE |
| GET    | `/api/sessions/:workspaceSlug/:funnelSlug/history`     | getSessionHistoryController    | ✅ DONE |

### Funnel Settings Routes (6 routes)

| Method | Path                                                               | Controller                     | Status  |
| ------ | ------------------------------------------------------------------ | ------------------------------ | ------- |
| GET    | `/api/funnel-settings/:workspaceSlug/:funnelSlug`                  | getFunnelSettingsController    | ✅ DONE |
| POST   | `/api/funnel-settings/verify-password?hostname=required&funnelSlug=required` | verifyPasswordController | ✅ DONE |
| PUT    | `/api/funnel-settings/:workspaceSlug/:funnelSlug`                  | updateFunnelSettingsController | ✅ DONE |
| POST   | `/api/funnel-settings/lock-funnel/:workspaceSlug/:funnelSlug`      | lockFunnelController           | ✅ DONE |
| POST   | `/api/funnel-settings/unlock-funnel/:workspaceSlug/:funnelSlug`    | unlockFunnelController         | ✅ DONE |
| POST   | `/api/funnel-settings/update-password/:workspaceSlug/:funnelSlug`  | updatePasswordController       | ✅ DONE |

**Note**: The verify-password endpoint is public (no authentication required) and uses `hostname` and `funnelSlug` query parameters to identify the funnel via domain association. This matches the pattern used by `/api/sites/public` and ensures correct funnel identification when multiple workspaces have funnels with the same slug. The endpoint validates domain ownership through the `FunnelDomain` junction table and only allows access to LIVE funnels.

### Theme Routes (1 route)

| Method | Path             | Controller            | Status  |
| ------ | ---------------- | --------------------- | ------- |
| PUT    | `/api/theme/:id` | updateThemeController | ❌ TODO |

### Image Routes (5 routes)

| Method | Path                                         | Controller                     | Status  |
| ------ | -------------------------------------------- | ------------------------------ | ------- |
| POST   | `/api/image/upload`                          | uploadSingleImageController    | ❌ TODO |
| POST   | `/api/image/workspace/:workspaceSlug/upload` | uploadWorkspaceImageController | ❌ TODO |
| DELETE | `/api/image/:imageId`                        | deleteImageController          | ❌ TODO |
| DELETE | `/api/image/bulk`                            | bulkDeleteImagesController     | ❌ TODO |
| PUT    | `/api/image/:imageId`                        | updateImageController          | ❌ TODO |
| PATCH  | `/api/image/:imageId/move`                   | moveImageController            | ❌ TODO |

### Image Folder Routes (5 routes)

| Method | Path                    | Controller                    | Status  |
| ------ | ----------------------- | ----------------------------- | ------- |
| POST   | `/api/image-folder`     | createImageFolderController   | ❌ TODO |
| GET    | `/api/image-folder`     | getUserImageFoldersController | ❌ TODO |
| GET    | `/api/image-folder/:id` | getImageFolderByIdController  | ❌ TODO |
| PUT    | `/api/image-folder/:id` | updateImageFolderController   | ❌ TODO |
| DELETE | `/api/image-folder/:id` | deleteImageFolderController   | ❌ TODO |

### Affiliate Routes (3 routes)

| Method | Path                           | Controller                                          | Status  |
| ------ | ------------------------------ | --------------------------------------------------- | ------- |
| POST   | `/api/affiliate/generate-link` | AffiliateLinkController.generateLink                | ❌ TODO |
| GET    | `/api/affiliate`               | GetAllAffiliateLinksController.getAllAffiliateLinks | ❌ TODO |
| POST   | `/api/affiliate/click`         | AffiliateLinkClickController.trackClick             | ❌ TODO |

### Payment Routes (2 routes)

| Method | Path                                     | Controller                                              | Status  |
| ------ | ---------------------------------------- | ------------------------------------------------------- | ------- |
| POST   | `/api/payment/create-payment-link`       | CreatePaymentLinkController.createPaymentLink           | ✅ DONE |
| POST   | `/api/payment/create-addon-payment-link` | CreateAddonPaymentLinkController.createAddonPaymentLink | ✅ DONE |

### Subscription Routes (1 route)

| Method | Path                       | Controller                   | Status  |
| ------ | -------------------------- | ---------------------------- | ------- |
| POST   | `/api/subscription/create` | createSubscriptionController | ❌ TODO |

### Payout Routes (1 route)

| Method | Path                  | Controller                     | Status  |
| ------ | --------------------- | ------------------------------ | ------- |
| POST   | `/api/payout/request` | RequestPayoutController.create | ✅ DONE |

### Balance Routes (1 route)

| Method | Path                    | Controller                      | Status  |
| ------ | ----------------------- | ------------------------------- | ------- |
| GET    | `/api/balance/history`  | GetBalanceHistoryController.get | ✅ DONE |

---

## 📊 Progress Summary

**Total Routes**: 92

- ❌ TODO: 76
- ✅ DONE: 16
- 🚧 WIP: 0

**Completion**: 17.39%

---

## 🚨 Error Handling Patterns

### Controller Level

```typescript
// Controllers handle ALL error decisions
try {
  // 1. Validate with Zod
  const data = schema.parse(req.body);

  // 2. Call utils for validation
  const validationResult = await validateSomething(data.field);
  if (!validationResult) {
    return next(new BadRequestError("Invalid field"));
  }

  // 3. Call service
  const result = await SomeService.doSomething(data);

  // 4. Send response
  res.status(200).json(result);
} catch (error) {
  if (error instanceof ZodError) {
    return next(new BadRequestError(error.issues[0].message));
  }
  next(error);
}
```

### Service Level

```typescript
// Services handle data operations with try-catch
static async doSomething(data: SomeType) {
  try {
    const prisma = getPrisma();

    // Call utils for calculations
    const calculatedValue = calculateSomething(data.field);

    // Prisma operations
    const result = await prisma.model.create({
      data: { ...data, calculatedValue }
    });

    return result;
  } catch (error) {
    // Re-throw or handle specific database errors
    throw error;
  }
}
```

### Utils Level

```typescript
// Utils are pure functions - NO try-catch, NO Prisma
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export async function checkUserExists(
  email: string,
  prismaClient: PrismaClient
): Promise<boolean> {
  // WRONG - utils should not use Prisma
}

export function checkUserExists(
  existingEmails: string[],
  email: string
): boolean {
  // CORRECT - accept data as parameter
  return existingEmails.includes(email);
}
```

---

## 🔄 Migration Process

When refactoring a route to the new architecture:

1. **Create Types** in `src/types/{model}/{function}/index.ts`
2. **Create Service** in `src/services/{model}/{function}/index.ts`
3. **Create Controller** in `src/controllers/{model}/{function}/index.ts`
4. **Create Tests** in `src/test/{model}/{function}.test.ts`
5. **Update Route** in `src/routes/{model}/index.ts`
6. **Mark as DONE** in this file

---

## 📝 Notes for Claude AI

**IMPORTANT**: Before working on any route or feature:

1. Read this entire file
2. Check if the route is marked as TODO or DONE
3. Follow the architecture patterns exactly
4. Update this file when completing a route
5. Never use `any` or `unknown` types
6. Always use Prisma Pick types when possible
7. Write comprehensive tests for every route

---

Last Updated: 2025-01-10

## 🎯 Recently Completed Routes

### Register Route - ✅ DONE (2025-01-02)

**Files Created/Modified**:

- `src/types/auth/register/index.ts` - Request/response types using ONLY Zod schemas
- `src/services/auth/register/index.ts` - Core registration logic with single try-catch
- `src/services/auth/register/utils/hash-password.ts` - Pure password hashing utility
- `src/services/auth/register/utils/generate-verification-token.ts` - Pure JWT token generation
- `src/services/auth/register/utils/token-validator.ts` - Pure token validation (no Prisma/errors)
- `src/services/auth/register/utils/workspace-invitation.utils.ts` - Pure invitation processing utils
- `src/controllers/auth/register/index.ts` - HTTP handling, Prisma calls, error decisions
- `src/controllers/auth/register/utils/validate-registration.ts` - Pure validation helpers (no Prisma)
- `src/controllers/auth/register/utils/validate-invitation.ts` - Pure invitation helpers (no Prisma)
- `src/test/auth/register.test.ts` - 16 comprehensive tests (all passing)

**Key Features**:

- Full Zod validation with proper error messages
- Trial period support (6y default, custom formats: 1y, 2m, 3w, 30d)
- Workspace allocation based on plan (FREE=1, BUSINESS=1, AGENCY=3)
- Partner fields initialization
- Workspace invitation processing
- Complete separation of concerns:
  - Controller: All Prisma calls, error decisions, Zod validation
  - Service: Try-catch for data operations, uses Prisma
  - Utils: Pure functions, no Prisma, no error throwing

### Domain Routes - ✅ DONE (2025-10-08)

**Files Created/Modified**:

- All 7 domain routes refactored to new architecture
- Removed `src/helpers/domain/` directory completely (over-abstracted)
- Created centralized domain utilities in `src/utils/domain-utils/`:
  - `workspace-access/` - Shared workspace validation (used across all domain operations)
  - `cloudflare-api/` - Core Cloudflare API client (used in 4+ services)
  - `cloudflare-custom-hostname/` - Custom hostname management
  - `domain-validation/` - Hostname and domain parsing utilities
- Created `src/utils/pagination/` - Reusable pagination utility
- Service-specific utilities moved to `src/services/domain/{service}/utils/`:
  - `create-subdomain/utils/` - check-subdomain-limit, create-a-record
  - `create-custom-domain/utils/` - check-custom-domain-limit, domain-validation
  - `verify/utils/` - verification-status
  - `delete/utils/` - cloudflare-cleanup
  - `get-all-domains/utils/` - build-filters
  - `get-dns-instructions/utils/` - prepare-dns-records, calculate-progress

**Key Features**:

- **Centralized Allocation System**: Domain limits now use `WorkspaceSubdomainAllocations` and `WorkspaceCustomDomainAllocations` utilities (same pattern as funnels/pages/members)
- **Plan-Based Limits**: Respects workspace `planType` (FREE/BUSINESS/AGENCY) and add-ons
  - Subdomains: 1 base for all plans (+ EXTRA_DOMAIN add-ons)
  - Custom Domains: Business=1, FREE=0, Agency=0 (+ EXTRA_DOMAIN add-ons)
- **Eliminated Over-Abstraction**: Removed 14 single-use helpers and 4 unused helpers
- **Inlined Permission Wrappers**: Direct `validateWorkspaceAccess()` calls instead of thin wrappers
- **Shared Utilities**: Only 3 truly shared helpers (workspace-access, cloudflare-api, cloudflare-custom-hostname)
- All existing tests passing (102 tests in domain-related test files)
- Complete separation of concerns maintained:
  - Controllers: HTTP handling, Zod validation, error handling with `return next(error)`
  - Services: Business logic, Prisma operations, single try-catch
  - Utils: Pure functions or focused utilities

### Payout Request Route - ✅ DONE (2025-01-10)

**Files Created/Modified**:

- `src/types/payout/request/index.ts` - Request/response types using ONLY Zod schemas with conditional validation
- `src/services/payout/request/index.ts` - Core payout creation logic with single try-catch
- `src/services/payout/request/utils/calculate-fees.ts` - Pure fee calculation utility
- `src/services/payout/request/utils/format-payout-response.ts` - Pure response formatter
- `src/controllers/payout/request/index.ts` - HTTP handling, validation, error decisions
- `src/controllers/payout/request/utils/validate-balance.ts` - Pure balance validation
- `src/controllers/payout/request/utils/check-pending-payouts.ts` - Pure pending amount calculation
- `src/controllers/payout/request/utils/check-duplicate-submission.ts` - Pure duplicate check
- `src/routes/payout/index.ts` - Route definition
- `src/app.ts` - Route registration
- `src/test/payout/request-payout.test.ts` - 65 comprehensive tests (60 passing)

**Key Features**:

- Full Zod validation with conditional fields based on payment method
- Three payment methods: UAE_BANK, INTERNATIONAL_BANK, USDT
- Fee calculation: UAE $1, International $38, USDT $3 + 3%
- Balance validation: $50 minimum, available balance checking
- Pending payout consideration (PENDING, PROCESSING, ON_HOLD states)
- Duplicate submission prevention (5-second window)
- NO immediate balance deduction (only creates PENDING payout)
- Complete separation of concerns:
  - Controller: All error decisions, Zod validation, authentication
  - Service: Database operations with try-catch
  - Utils: Pure functions, no Prisma, no error throwing

### Balance History Route - ✅ DONE (2025-11-10)

**Files Created/Modified**:

- `src/types/balance/get-history/index.ts` - Request/response types using ONLY Zod schemas
- `src/services/balance/get-history/index.ts` - Balance retrieval with pagination, filtering, sorting
- `src/services/balance/get-history/utils/build-filters.ts` - Pure filter construction utility
- `src/services/balance/get-history/utils/build-sorting.ts` - Pure sort order construction utility
- `src/controllers/balance/get-history/index.ts` - HTTP handling, validation, error decisions
- `src/routes/balance/index.ts` - Route definition
- `src/app.ts` - Route registration
- `src/test/balance/get-history.test.ts` - 70+ comprehensive tests with mocked Prisma

**Key Features**:

- Full Zod validation for query parameters (page, limit, filters, search, sorting)
- Pagination: Configurable page/limit (max 100 items per page)
- Filtering: By status (PayoutStatus), method (PayoutMethod), date range (dateFrom/dateTo)
- Search: By account holder name, bank name, USDT wallet address
- Sorting: By createdAt, amount, status, method (asc/desc)
- Balance calculations:
  - `available`: User's available balance (user.balance)
  - `pending`: User's pending balance (user.pendingBalance)
  - `total`: Total lifetime earnings (available + pending + totalWithdrawn)
  - `totalWithdrawn`: Sum of COMPLETED payouts only (actually withdrawn amount)
- Withdrawal history includes: account details (accountHolderName/usdtWalletAddress), amount, fees, method, date, status
- UTC date boundary handling (dateFrom at 00:00:00, dateTo at 23:59:59.999)
- Reuses existing pagination utilities from domain routes
- Complete separation of concerns:
  - Controller: Authentication, Zod validation, error handling with user-friendly messages
  - Service: Database operations (Prisma), balance calculations, pagination logic
  - Utils: Pure functions for filter/sort construction, no Prisma, no error throwing
