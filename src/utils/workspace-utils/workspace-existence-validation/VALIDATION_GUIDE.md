# Workspace Existence Validation Guide

## Overview

The **WorkspaceValidator** is the centralized utility for validating workspace existence across the application. It provides a consistent, type-safe way to fetch and validate workspaces with flexible query options.

## Core Principles

1. **Single Source of Truth** - All workspace existence checks should use `WorkspaceValidator`
2. **Consistent Error Messages** - Same error message everywhere: "We couldn't find that workspace"
3. **Flexible Data Loading** - Load only what you need (plan, add-ons, members, etc.)
4. **Type Safety** - Generic types ensure you get the right data structure back

## When to Use

Use `WorkspaceValidator` whenever you need to:

- ✅ Validate a workspace exists before performing operations
- ✅ Fetch workspace data for allocation checks (plan + add-ons)
- ✅ Check workspace existence without throwing errors
- ✅ Ensure consistent error handling across services

## API Reference

### Basic Validation

#### `validateBySlug(prisma, slug, options?)`

Validates workspace exists by slug and returns workspace data.

```typescript
import { WorkspaceValidator } from "@/utils/workspace-utils/workspace-existence-validation";

// Basic validation (id, name, ownerId only)
const workspace = await WorkspaceValidator.validateBySlug(prisma, "my-workspace");

// Returns: { id: number, name: string, ownerId: number }
```

**Throws:** Error with message "We couldn't find that workspace" if not found

#### `validateById(prisma, id, options?)`

Validates workspace exists by ID.

```typescript
const workspace = await WorkspaceValidator.validateById(prisma, 123);
```

### Validation with Additional Data

Use the `options` parameter to include additional data:

```typescript
interface WorkspaceValidationOptions {
  includePlan?: boolean;      // Include owner.plan
  includeAddOns?: boolean;     // Include owner.addOns (active only)
  includeMembers?: boolean;    // Include workspace members
  customSelect?: Record<string, unknown>; // Custom Prisma select
}
```

#### Example: Include Plan

```typescript
const workspace = await WorkspaceValidator.validateBySlug(prisma, "my-workspace", {
  includePlan: true,
});

// Returns: { id, name, ownerId, owner: { plan: UserPlan } }
```

#### Example: Include Plan and Add-ons

```typescript
import { WorkspaceWithAllocation } from "@/utils/workspace-utils/workspace-existence-validation";

const workspace = await WorkspaceValidator.validateBySlug<WorkspaceWithAllocation>(
  prisma,
  "my-workspace",
  {
    includePlan: true,
    includeAddOns: true,
  }
);

// Returns: {
//   id, name, ownerId,
//   owner: {
//     plan: UserPlan,
//     addOns: [{ type: AddOnType, quantity: number, status: string }]
//   }
// }
```

### Convenience Methods

#### `validateWithAllocation(prisma, slug)`

Shorthand for validating with plan and add-ons (commonly needed for allocation checks).

```typescript
const workspace = await WorkspaceValidator.validateWithAllocation(prisma, "my-workspace");

// Equivalent to:
// WorkspaceValidator.validateBySlug(prisma, slug, {
//   includePlan: true,
//   includeAddOns: true
// })
```

#### `exists(prisma, slug)` - Non-throwing

Check if workspace exists without throwing an error.

```typescript
const exists = await WorkspaceValidator.exists(prisma, "my-workspace");

if (!exists) {
  // Handle non-existence
}
```

#### `existsById(prisma, id)` - Non-throwing

```typescript
const exists = await WorkspaceValidator.existsById(prisma, 123);
```

## Common Use Cases

### Use Case 1: Create Funnel (with allocation check)

```typescript
import { WorkspaceValidator } from "@/utils/workspace-utils/workspace-existence-validation";
import { WorkspaceWithAllocation } from "@/utils/workspace-utils/workspace-existence-validation";

// Validate workspace and get allocation data in one call
const workspace = await WorkspaceValidator.validateWithAllocation(
  prisma,
  data.workspaceSlug
);

// Now check allocations
const canCreate = WorkspaceFunnelAllocations.canCreateFunnel(
  currentCount,
  {
    workspacePlanType: workspace.owner.plan,
    addOns: workspace.owner.addOns,
  }
);
```

### Use Case 2: Update Workspace (basic validation)

```typescript
// Only need basic workspace info
const workspace = await WorkspaceValidator.validateBySlug(prisma, slug);

// workspace: { id, name, ownerId }
```

### Use Case 3: Check if Workspace Exists (optional operation)

```typescript
// Non-throwing check
if (await WorkspaceValidator.exists(prisma, optionalSlug)) {
  // Perform operation
}
```

### Use Case 4: Custom Select Query

```typescript
const workspace = await WorkspaceValidator.validateBySlug(prisma, slug, {
  customSelect: {
    id: true,
    name: true,
    slug: true,
    members: {
      where: { role: "OWNER" },
      select: { userId: true },
    },
  },
});
```

## Type Safety

The validator supports generic types for type-safe returns:

```typescript
import {
  BaseWorkspaceInfo,
  WorkspaceWithPlan,
  WorkspaceWithAllocation,
} from "@/utils/workspace-utils/workspace-existence-validation";

// Basic
const workspace1 = await WorkspaceValidator.validateBySlug<BaseWorkspaceInfo>(
  prisma,
  slug
);

// With plan
const workspace2 = await WorkspaceValidator.validateBySlug<WorkspaceWithPlan>(
  prisma,
  slug,
  { includePlan: true }
);

// With allocation
const workspace3 = await WorkspaceValidator.validateBySlug<WorkspaceWithAllocation>(
  prisma,
  slug,
  { includePlan: true, includeAddOns: true }
);
```

## Migration Guide

### Before (Scattered Validation)

```typescript
// services/funnel/create/utils/validateWorkspace.ts
export const validateWorkspace = async (
  prisma: PrismaClient,
  workspaceSlug: string
): Promise<WorkspacePayload> => {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: {
      id: true,
      name: true,
      ownerId: true,
      owner: {
        select: {
          plan: true,
          addOns: { where: { status: "ACTIVE" }, select: { type: true, quantity: true, status: true } },
        },
      },
    },
  });

  if (!workspace) {
    throw new Error("We couldn't find that workspace");
  }

  return workspace;
};
```

### After (Centralized Validation)

```typescript
import { WorkspaceValidator } from "@/utils/workspace-utils/workspace-existence-validation";

const workspace = await WorkspaceValidator.validateWithAllocation(
  prisma,
  data.workspaceSlug
);
```

## Best Practices

### ✅ DO

- Use `WorkspaceValidator` for all workspace existence checks
- Use `validateWithAllocation()` when you need plan/add-on data
- Use `exists()` for optional/non-throwing checks
- Specify generic types for better type safety
- Load only the data you need

### ❌ DON'T

- Don't create custom workspace validation functions
- Don't use `prisma.workspace.findUnique()` directly in services
- Don't duplicate workspace existence error messages
- Don't load unnecessary data (use options to be selective)

## Error Handling

All validation methods (except `exists()` and `existsById()`) throw an error with the message:

```
"We couldn't find that workspace"
```

This provides a consistent, user-friendly error message across the entire application.

```typescript
try {
  const workspace = await WorkspaceValidator.validateBySlug(prisma, slug);
  // Use workspace
} catch (error) {
  // Error message: "We couldn't find that workspace"
  // Handle not found case
}
```

## Testing

When testing services that use `WorkspaceValidator`, mock it appropriately:

```typescript
import { WorkspaceValidator } from "@/utils/workspace-utils/workspace-existence-validation";

jest.mock("@/utils/workspace-utils/workspace-existence-validation");

const mockWorkspace = {
  id: 1,
  name: "Test Workspace",
  ownerId: 123,
  owner: {
    plan: UserPlan.BUSINESS,
    addOns: [],
  },
};

(WorkspaceValidator.validateWithAllocation as jest.Mock).mockResolvedValue(
  mockWorkspace
);
```

## Summary

The `WorkspaceValidator` provides:

- ✅ **Centralized** workspace existence validation
- ✅ **Consistent** error messages
- ✅ **Flexible** data loading options
- ✅ **Type-safe** return types
- ✅ **Performance** optimized (load only what you need)
- ✅ **Maintainable** single source of truth

Use it everywhere you need to validate workspace existence!
