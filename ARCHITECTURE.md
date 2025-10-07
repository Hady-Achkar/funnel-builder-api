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

**Requirements**:

- Test the actual controller and service (not mocks)
- Cover all edge cases
- Test validation failures
- Test authorization scenarios
- Test success scenarios
- Use descriptive test names

**Example**:

```typescript
// src/test/workspace/create-workspace.test.ts
describe("Create Workspace", () => {
  describe("Validation", () => {
    it("should reject invalid slug format", async () => {});
    it("should reject empty name", async () => {});
  });

  describe("Authorization", () => {
    it("should reject unauthenticated requests", async () => {});
    it("should reject when workspace limit reached", async () => {});
  });

  describe("Success Cases", () => {
    it("should create workspace with valid data", async () => {});
    it("should generate unique slug", async () => {});
  });
});
```

---

## 🚦 Route Migration Tracking

### Status Legend:

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
| POST   | `/api/funnel/:id/duplicate`                   | duplicateFunnelController     | ❌ TODO |
| GET    | `/api/funnel/workspace/:workspaceSlug/public` | getPublicFunnelPageController | ❌ TODO |
| GET    | `/api/funnel/workspace/:workspaceSlug`        | getAllFunnelsController       | ❌ TODO |
| GET    | `/api/funnel/:id`                             | getFunnelController           | ❌ TODO |
| PUT    | `/api/funnel/:id`                             | updateFunnelController        | ❌ TODO |
| DELETE | `/api/funnel/:id`                             | deleteFunnelController        | ✅ DONE |

### Page Routes (8 routes)

| Method | Path                                              | Controller                   | Status  |
| ------ | ------------------------------------------------- | ---------------------------- | ------- |
| POST   | `/api/page/funnels/:funnelId`                     | createPageController         | ❌ TODO |
| PUT    | `/api/page/funnels/:funnelId/reorder`             | updatePageOrderController    | ❌ TODO |
| GET    | `/api/page/:id`                                   | getPageController            | ❌ TODO |
| PUT    | `/api/page/:id`                                   | updatePageController         | ❌ TODO |
| DELETE | `/api/page/:id`                                   | deletePageController         | ❌ TODO |
| POST   | `/api/page/:pageId/duplicate`                     | duplicatePageController      | ❌ TODO |
| GET    | `/api/page/funnel/:funnelId/page-by-link/:linkId` | getPageByLinkingIdController | ❌ TODO |
| POST   | `/api/page/:pageId/visit`                         | createPageVisitController    | ❌ TODO |

### Domain Routes (7 routes)

| Method | Path                                           | Controller                                   | Status  |
| ------ | ---------------------------------------------- | -------------------------------------------- | ------- |
| POST   | `/api/domain/subdomain`                        | CreateSubdomainController.create             | ❌ TODO |
| POST   | `/api/domain/custom`                           | CreateCustomDomainController.create          | ❌ TODO |
| DELETE | `/api/domain/:id`                              | DeleteDomainController.delete                | ❌ TODO |
| POST   | `/api/domain/verify/:id`                       | VerifyDomainController.verify                | ❌ TODO |
| GET    | `/api/domain/workspace/:workspaceId`           | GetAllDomainsController.getAll               | ❌ TODO |
| GET    | `/api/domain/workspace-summary/:workspaceSlug` | getWorkspaceDomainsSummaryController         | ❌ TODO |
| GET    | `/api/domain/:id/dns-instructions`             | GetDnsInstructionsController.getInstructions | ❌ TODO |

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

### Funnel Settings Routes (5 routes)

| Method | Path                                             | Controller                     | Status  |
| ------ | ------------------------------------------------ | ------------------------------ | ------- |
| GET    | `/api/funnel-settings/:funnelId`                 | getFunnelSettingsController    | ❌ TODO |
| POST   | `/api/funnel-settings/verify-password/:funnelId` | verifyPasswordController       | ❌ TODO |
| PUT    | `/api/funnel-settings/:id`                       | updateFunnelSettingsController | ❌ TODO |
| POST   | `/api/funnel-settings/lock-funnel/:funnelId`     | lockFunnelController           | ❌ TODO |
| POST   | `/api/funnel-settings/unlock-funnel/:funnelId`   | unlockFunnelController         | ❌ TODO |

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

### Payment Routes (1 route)

| Method | Path                               | Controller                                    | Status  |
| ------ | ---------------------------------- | --------------------------------------------- | ------- |
| POST   | `/api/payment/create-payment-link` | CreatePaymentLinkController.createPaymentLink | ❌ TODO |

### Subscription Routes (1 route)

| Method | Path                       | Controller                   | Status  |
| ------ | -------------------------- | ---------------------------- | ------- |
| POST   | `/api/subscription/create` | createSubscriptionController | ❌ TODO |

---

## 📊 Progress Summary

**Total Routes**: 87

- ❌ TODO: 84
- ✅ DONE: 3
- 🚧 WIP: 0

**Completion**: 3.45%

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

Last Updated: 2025-10Oct

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
