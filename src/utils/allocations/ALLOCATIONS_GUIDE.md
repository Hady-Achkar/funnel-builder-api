# Resource Allocation System Guide

## Overview

The Resource Allocation System is the **single source of truth** for all plan-based limits and quotas in the application. It manages resource limits across:

- **User Workspaces** - How many workspaces a user can create
- **Workspace Members** - How many members can join a workspace
- **Workspace Funnels** - How many funnels can be created in a workspace
- **Funnel Pages** - How many pages can be in a funnel
- **Workspace Subdomains** - How many subdomains a workspace can have
- **Workspace Custom Domains** - How many custom domains a workspace can connect

## Architecture

### Plan Types

The system supports three plan types (defined in `UserPlan` enum):

```typescript
enum UserPlan {
  FREE     // Free tier with basic limits
  BUSINESS // Mid-tier with enhanced limits
  AGENCY   // Top tier with maximum limits
}
```

### Add-On System

Plans can be extended with add-ons (defined in `AddOnType` enum):

```typescript
enum AddOnType {
  EXTRA_WORKSPACE  // Adds additional workspace slots
  EXTRA_ADMIN      // Adds additional member slots (mainly for Agency)
  EXTRA_FUNNEL     // Adds additional funnel slots
  EXTRA_PAGE       // Adds 5 additional pages per funnel per unit
  EXTRA_DOMAIN     // Adds additional domain slots (both subdomain and custom)
}
```

Add-ons must have `status: 'ACTIVE'` to be counted in allocation calculations.

---

## Allocation Utilities

### 1. User Workspace Allocations

**Location:** `src/utils/allocations/user-workspace-allocations/index.ts`

**Purpose:** Manages how many workspaces a user can create based on their plan.

#### Base Allocations

| Plan     | Base Workspaces |
|----------|-----------------|
| FREE     | 1               |
| BUSINESS | 1               |
| AGENCY   | 3               |

#### API

```typescript
import { UserWorkspaceAllocations } from './utils/allocations/user-workspace-allocations';

// Get base allocation (without add-ons)
const base = UserWorkspaceAllocations.getBaseAllocation(UserPlan.BUSINESS);
// Returns: 1

// Calculate total allocation (including add-ons)
const total = UserWorkspaceAllocations.calculateTotalAllocation({
  plan: UserPlan.BUSINESS,
  addOns: [
    { type: AddOnType.EXTRA_WORKSPACE, quantity: 2, status: 'ACTIVE' }
  ]
});
// Returns: 3 (1 base + 2 from add-ons)

// Check if user can create more workspaces
const canCreate = UserWorkspaceAllocations.canCreateWorkspace(
  currentWorkspaceCount: 2,
  { plan: UserPlan.BUSINESS, addOns: [...] }
);
// Returns: true if current < total

// Get remaining slots
const remaining = UserWorkspaceAllocations.getRemainingSlots(
  currentWorkspaceCount: 1,
  { plan: UserPlan.BUSINESS }
);
// Returns: 0 (1 total - 1 current)

// Get full summary
const summary = UserWorkspaceAllocations.getAllocationSummary(
  currentWorkspaceCount: 1,
  { plan: UserPlan.AGENCY, addOns: [] }
);
// Returns: {
//   baseAllocation: 3,
//   extraFromAddOns: 0,
//   totalAllocation: 3,
//   currentUsage: 1,
//   remainingSlots: 2,
//   canCreateMore: true
// }
```

---

### 2. Workspace Member Allocations

**Location:** `src/utils/allocations/workspace-member-allocations/index.ts`

**Purpose:** Manages how many members can join a workspace based on the workspace's plan type.

#### Base Allocations

| Workspace Plan Type | Base Members |
|---------------------|--------------|
| FREE                | 3            |
| BUSINESS            | 3            |
| AGENCY              | 500          |

**Note:** For Agency plan, additional members can be purchased via `EXTRA_ADMIN` add-ons at $5/month each.

#### API

```typescript
import { WorkspaceMemberAllocations } from './utils/allocations/workspace-member-allocations';

// Get base allocation
const base = WorkspaceMemberAllocations.getBaseAllocation(UserPlan.BUSINESS);
// Returns: 3

// Calculate total allocation
const total = WorkspaceMemberAllocations.calculateTotalAllocation({
  workspacePlanType: UserPlan.AGENCY,
  addOns: [
    { type: AddOnType.EXTRA_ADMIN, quantity: 50, status: 'ACTIVE' }
  ]
});
// Returns: 550 (500 base + 50 from add-ons)

// Check if workspace can add more members
const canAdd = WorkspaceMemberAllocations.canAddMember(
  currentMemberCount: 2,
  { workspacePlanType: UserPlan.FREE }
);
// Returns: true (2 < 3)

// Get allocation summary
const summary = WorkspaceMemberAllocations.getAllocationSummary(
  currentMemberCount: 2,
  { workspacePlanType: UserPlan.FREE, addOns: [] }
);
// Returns: {
//   baseAllocation: 3,
//   extraFromAddOns: 0,
//   totalAllocation: 3,
//   currentUsage: 2,
//   remainingSlots: 1,
//   canAddMore: true
// }
```

---

### 3. Workspace Funnel Allocations

**Location:** `src/utils/allocations/workspace-funnel-allocations/index.ts`

**Purpose:** Manages how many funnels can be created in a workspace.

#### Base Allocations

| Workspace Plan Type | Base Funnels |
|---------------------|--------------|
| FREE                | 3            |
| BUSINESS            | 1            |
| AGENCY              | 999          |

#### API

```typescript
import { WorkspaceFunnelAllocations } from './utils/allocations/workspace-funnel-allocations';

// Get base allocation
const base = WorkspaceFunnelAllocations.getBaseAllocation(UserPlan.FREE);
// Returns: 3

// Calculate total allocation
const total = WorkspaceFunnelAllocations.calculateTotalAllocation({
  workspacePlanType: UserPlan.BUSINESS,
  addOns: [
    { type: AddOnType.EXTRA_FUNNEL, quantity: 4, status: 'ACTIVE' }
  ]
});
// Returns: 5 (1 base + 4 from add-ons)

// Check if workspace can create more funnels
const canCreate = WorkspaceFunnelAllocations.canCreateFunnel(
  currentFunnelCount: 3,
  { workspacePlanType: UserPlan.FREE }
);
// Returns: false (3 >= 3)

// Get allocation summary
const summary = WorkspaceFunnelAllocations.getAllocationSummary(
  currentFunnelCount: 1,
  { workspacePlanType: UserPlan.BUSINESS, addOns: [] }
);
// Returns: {
//   baseAllocation: 1,
//   extraFromAddOns: 0,
//   totalAllocation: 1,
//   currentUsage: 1,
//   remainingSlots: 0,
//   canCreateMore: false
// }
```

---

### 4. Funnel Page Allocations

**Location:** `src/utils/allocations/funnel-page-allocations/index.ts`

**Purpose:** Manages how many pages can be created in a funnel.

#### Base Allocations

| Workspace Plan Type | Base Pages per Funnel |
|---------------------|-----------------------|
| FREE                | 35                    |
| BUSINESS            | 35                    |
| AGENCY              | 35                    |

**Special Add-On Behavior:** Each `EXTRA_PAGE` add-on unit adds **5 pages** to the limit.

#### API

```typescript
import { FunnelPageAllocations } from './utils/allocations/funnel-page-allocations';

// Get base allocation
const base = FunnelPageAllocations.getBaseAllocation(UserPlan.FREE);
// Returns: 35

// Calculate total allocation with add-ons
const total = FunnelPageAllocations.calculateTotalAllocation({
  workspacePlanType: UserPlan.BUSINESS,
  addOns: [
    { type: AddOnType.EXTRA_PAGE, quantity: 3, status: 'ACTIVE' }
  ]
});
// Returns: 50 (35 base + 15 from add-ons [3 × 5])

// Check if funnel can have more pages
const canCreate = FunnelPageAllocations.canCreatePage(
  currentPageCount: 35,
  { workspacePlanType: UserPlan.FREE }
);
// Returns: false (35 >= 35)

// Get allocation summary
const summary = FunnelPageAllocations.getAllocationSummary(
  currentPageCount: 20,
  { workspacePlanType: UserPlan.FREE, addOns: [] }
);
// Returns: {
//   baseAllocation: 35,
//   extraFromAddOns: 0,
//   totalAllocation: 35,
//   currentUsage: 20,
//   remainingSlots: 15,
//   canCreateMore: true
// }
```

---

### 5. Workspace Subdomain Allocations

**Location:** `src/utils/allocations/workspace-subdomain-allocations/index.ts`

**Purpose:** Manages how many subdomains a workspace can create.

#### Base Allocations

| Workspace Plan Type | Base Subdomains |
|---------------------|-----------------|
| FREE                | 1               |
| BUSINESS            | 1               |
| AGENCY              | 1               |

#### API

```typescript
import { WorkspaceSubdomainAllocations } from './utils/allocations/workspace-subdomain-allocations';

// Get base allocation
const base = WorkspaceSubdomainAllocations.getBaseAllocation(UserPlan.BUSINESS);
// Returns: 1

// Calculate total allocation
const total = WorkspaceSubdomainAllocations.calculateTotalAllocation({
  workspacePlanType: UserPlan.AGENCY,
  addOns: [
    { type: AddOnType.EXTRA_DOMAIN, quantity: 5, status: 'ACTIVE' }
  ]
});
// Returns: 6 (1 base + 5 from add-ons)

// Check if workspace can create more subdomains
const canCreate = WorkspaceSubdomainAllocations.canCreateSubdomain(
  currentSubdomainCount: 1,
  { workspacePlanType: UserPlan.FREE }
);
// Returns: false (1 >= 1)

// Get allocation summary
const summary = WorkspaceSubdomainAllocations.getAllocationSummary(
  currentSubdomainCount: 0,
  { workspacePlanType: UserPlan.BUSINESS, addOns: [] }
);
// Returns: {
//   baseAllocation: 1,
//   extraFromAddOns: 0,
//   totalAllocation: 1,
//   currentUsage: 0,
//   remainingSlots: 1,
//   canCreateMore: true
// }
```

---

### 6. Workspace Custom Domain Allocations

**Location:** `src/utils/allocations/workspace-custom-domain-allocations/index.ts`

**Purpose:** Manages how many custom domains a workspace can connect.

#### Base Allocations

| Workspace Plan Type | Base Custom Domains |
|---------------------|---------------------|
| FREE                | 1                   |
| BUSINESS            | 1                   |
| AGENCY              | 1                   |

#### API

```typescript
import { WorkspaceCustomDomainAllocations } from './utils/allocations/workspace-custom-domain-allocations';

// Get base allocation
const base = WorkspaceCustomDomainAllocations.getBaseAllocation(UserPlan.FREE);
// Returns: 1

// Calculate total allocation
const total = WorkspaceCustomDomainAllocations.calculateTotalAllocation({
  workspacePlanType: UserPlan.BUSINESS,
  addOns: [
    { type: AddOnType.EXTRA_DOMAIN, quantity: 2, status: 'ACTIVE' }
  ]
});
// Returns: 3 (1 base + 2 from add-ons)

// Check if workspace can create more custom domains
const canCreate = WorkspaceCustomDomainAllocations.canCreateCustomDomain(
  currentCustomDomainCount: 1,
  { workspacePlanType: UserPlan.FREE }
);
// Returns: false (1 >= 1)

// Get allocation summary
const summary = WorkspaceCustomDomainAllocations.getAllocationSummary(
  currentCustomDomainCount: 0,
  { workspacePlanType: UserPlan.AGENCY, addOns: [] }
);
// Returns: {
//   baseAllocation: 1,
//   extraFromAddOns: 0,
//   totalAllocation: 1,
//   currentUsage: 0,
//   remainingSlots: 1,
//   canCreateMore: true
// }
```

---

## Legacy AllocationService

**Location:** `src/utils/allocations/index.ts`

The legacy `AllocationService` provides a unified interface for checking allocations. It's maintained for backward compatibility but **new code should use the specific allocation utilities** for better type safety and clarity.

### API

```typescript
import { AllocationService } from './utils/allocations';

// Check all allocations at once
const result = await AllocationService.checkAllocations(userId, workspaceId);
// Returns: {
//   canCreateFunnel: boolean,
//   canCreateSubdomain: boolean,
//   canCreateCustomDomain: boolean,
//   canAddMember: boolean,
//   canCreateWorkspace: boolean,
//   allocations: UserAllocations,
//   workspaceUsage: WorkspaceUsage,
//   userUsage: UserUsage
// }

// Individual checks
const canCreateFunnel = await AllocationService.canCreateFunnel(userId, workspaceId);
const canAddMember = await AllocationService.canAddMember(userId, workspaceId);
const canCreateWorkspace = await AllocationService.canCreateWorkspace(userId);
```

---

## Plan Comparison Matrix

| Resource                | FREE        | BUSINESS    | AGENCY      |
|------------------------|-------------|-------------|-------------|
| **User Level**         |             |             |             |
| Workspaces             | 1           | 1           | 3           |
| **Workspace Level**    |             |             |             |
| Members                | 3           | 3           | 500*        |
| Funnels                | 3           | 1           | 999         |
| Subdomains             | 1           | 1           | 1           |
| Custom Domains         | 1           | 1           | 1           |
| **Funnel Level**       |             |             |             |
| Pages per Funnel       | 35          | 35          | 35          |

\* Agency plan can purchase additional members via `EXTRA_ADMIN` add-on at $5/month each

---

## Add-On Pricing & Effects

| Add-On Type        | Effect                      | Typical Use Case           |
|-------------------|-----------------------------|-----------------------------|
| EXTRA_WORKSPACE   | +1 workspace                | Business users needing 2+ workspaces |
| EXTRA_ADMIN       | +1 member slot              | Agency workspaces with large teams |
| EXTRA_FUNNEL      | +1 funnel                   | Business users needing 2+ funnels |
| EXTRA_PAGE        | +5 pages per funnel         | Complex funnels with many steps |
| EXTRA_DOMAIN      | +1 domain (subdomain or custom) | Workspaces with multiple brands |

---

## Usage Examples

### Example 1: Check if User Can Create Workspace

```typescript
import { UserWorkspaceAllocations } from './utils/allocations/user-workspace-allocations';
import { getPrisma } from './lib/prisma';

async function canUserCreateWorkspace(userId: number): Promise<boolean> {
  const prisma = getPrisma();

  // Get user's plan and add-ons
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addOns: {
        where: { status: 'ACTIVE' }
      }
    }
  });

  if (!user) return false;

  // Get current workspace count
  const workspaceCount = await prisma.workspace.count({
    where: { ownerId: userId }
  });

  // Check if user can create more
  return UserWorkspaceAllocations.canCreateWorkspace(workspaceCount, {
    plan: user.plan,
    addOns: user.addOns
  });
}
```

### Example 2: Check if Workspace Can Add Member

```typescript
import { WorkspaceMemberAllocations } from './utils/allocations/workspace-member-allocations';
import { getPrisma } from './lib/prisma';

async function canWorkspaceAddMember(workspaceId: number): Promise<boolean> {
  const prisma = getPrisma();

  // Get workspace with owner's plan and add-ons
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      owner: {
        include: {
          addOns: {
            where: { status: 'ACTIVE' }
          }
        }
      }
    }
  });

  if (!workspace) return false;

  // Get current member count
  const memberCount = await prisma.workspaceMember.count({
    where: { workspaceId }
  });

  // Check if workspace can add more members
  return WorkspaceMemberAllocations.canAddMember(memberCount, {
    workspacePlanType: workspace.owner.plan,
    addOns: workspace.owner.addOns
  });
}
```

### Example 3: Display Allocation Summary to User

```typescript
import { WorkspaceFunnelAllocations } from './utils/allocations/workspace-funnel-allocations';
import { getPrisma } from './lib/prisma';

async function getFunnelAllocationSummary(workspaceId: number) {
  const prisma = getPrisma();

  // Get workspace data
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      owner: {
        include: {
          addOns: {
            where: { status: 'ACTIVE' }
          }
        }
      },
      funnels: true
    }
  });

  if (!workspace) throw new Error('Workspace not found');

  // Get allocation summary
  const summary = WorkspaceFunnelAllocations.getAllocationSummary(
    workspace.funnels.length,
    {
      workspacePlanType: workspace.owner.plan,
      addOns: workspace.owner.addOns
    }
  );

  return {
    plan: workspace.owner.plan,
    funnels: {
      current: summary.currentUsage,
      limit: summary.totalAllocation,
      remaining: summary.remainingSlots,
      canCreateMore: summary.canCreateMore
    },
    breakdown: {
      base: summary.baseAllocation,
      fromAddOns: summary.extraFromAddOns
    }
  };
}
```

### Example 4: Validate Before Creating Resource

```typescript
import { FunnelPageAllocations } from './utils/allocations/funnel-page-allocations';
import { getPrisma } from './lib/prisma';

async function createPage(funnelId: number, pageData: any) {
  const prisma = getPrisma();

  // Get funnel with workspace and owner data
  const funnel = await prisma.funnel.findUnique({
    where: { id: funnelId },
    include: {
      pages: true,
      workspace: {
        include: {
          owner: {
            include: {
              addOns: {
                where: { status: 'ACTIVE' }
              }
            }
          }
        }
      }
    }
  });

  if (!funnel) throw new Error('Funnel not found');

  // Check if we can create more pages
  const canCreate = FunnelPageAllocations.canCreatePage(
    funnel.pages.length,
    {
      workspacePlanType: funnel.workspace.owner.plan,
      addOns: funnel.workspace.owner.addOns
    }
  );

  if (!canCreate) {
    const summary = FunnelPageAllocations.getAllocationSummary(
      funnel.pages.length,
      {
        workspacePlanType: funnel.workspace.owner.plan,
        addOns: funnel.workspace.owner.addOns
      }
    );

    throw new Error(
      `Page limit reached. You have ${summary.currentUsage}/${summary.totalAllocation} pages. ` +
      `Upgrade your plan or purchase EXTRA_PAGE add-ons to create more pages.`
    );
  }

  // Create the page
  return prisma.page.create({
    data: {
      ...pageData,
      funnelId
    }
  });
}
```

---

## Best Practices

### 1. Always Check Allocations Before Creating Resources

```typescript
// ✅ GOOD: Check before creating
const canCreate = await WorkspaceFunnelAllocations.canCreateFunnel(...);
if (!canCreate) {
  throw new Error('Funnel limit reached');
}
await createFunnel(...);

// ❌ BAD: Create without checking
await createFunnel(...); // Might exceed limits
```

### 2. Use Specific Utilities Over Legacy Service

```typescript
// ✅ GOOD: Use specific utility
import { WorkspaceFunnelAllocations } from './utils/allocations/workspace-funnel-allocations';
const canCreate = WorkspaceFunnelAllocations.canCreateFunnel(...);

// ❌ BAD: Use legacy service
import { AllocationService } from './utils/allocations';
const result = await AllocationService.checkAllocations(...);
const canCreate = result.canCreateFunnel;
```

### 3. Include Add-Ons in Calculations

```typescript
// ✅ GOOD: Include add-ons
const user = await prisma.user.findUnique({
  include: { addOns: { where: { status: 'ACTIVE' } } }
});
const total = UserWorkspaceAllocations.calculateTotalAllocation({
  plan: user.plan,
  addOns: user.addOns
});

// ❌ BAD: Ignore add-ons
const total = UserWorkspaceAllocations.getBaseAllocation(user.plan);
```

### 4. Provide Helpful Error Messages

```typescript
// ✅ GOOD: Detailed error with upgrade path
if (!canCreate) {
  const summary = WorkspaceFunnelAllocations.getAllocationSummary(...);
  throw new Error(
    `You've reached your funnel limit (${summary.currentUsage}/${summary.totalAllocation}). ` +
    `Upgrade to ${user.plan === 'FREE' ? 'BUSINESS' : 'AGENCY'} plan or ` +
    `purchase EXTRA_FUNNEL add-ons for $10/month each.`
  );
}

// ❌ BAD: Generic error
if (!canCreate) {
  throw new Error('Cannot create funnel');
}
```

### 5. Use getAllocationSummary for UI Display

```typescript
// ✅ GOOD: Get full summary for UI
const summary = WorkspaceMemberAllocations.getAllocationSummary(
  currentMemberCount,
  { workspacePlanType, addOns }
);

return {
  members: {
    current: summary.currentUsage,
    limit: summary.totalAllocation,
    percentage: (summary.currentUsage / summary.totalAllocation) * 100,
    canAddMore: summary.canAddMore
  }
};

// ❌ BAD: Calculate separately
const total = WorkspaceMemberAllocations.calculateTotalAllocation(...);
const canAdd = WorkspaceMemberAllocations.canAddMember(...);
const remaining = total - currentMemberCount;
```

---

## Testing

Comprehensive tests are available in:
- `src/test/utils/allocations/allocation-utilities.test.ts`

Run tests:
```bash
npm test -- src/test/utils/allocations/allocation-utilities.test.ts
```

---

## Migration Notes

If you're migrating from the legacy `AllocationService` to the new utilities:

### Before (Legacy)
```typescript
import { AllocationService } from './utils/allocations';

const canCreate = await AllocationService.canCreateFunnel(userId, workspaceId);
```

### After (New Utilities)
```typescript
import { WorkspaceFunnelAllocations } from './utils/allocations/workspace-funnel-allocations';
import { getPrisma } from './lib/prisma';

const prisma = getPrisma();
const workspace = await prisma.workspace.findUnique({
  where: { id: workspaceId },
  include: {
    owner: { include: { addOns: { where: { status: 'ACTIVE' } } } },
    funnels: true
  }
});

const canCreate = WorkspaceFunnelAllocations.canCreateFunnel(
  workspace.funnels.length,
  {
    workspacePlanType: workspace.owner.plan,
    addOns: workspace.owner.addOns
  }
);
```

---

## Troubleshooting

### Issue: Add-ons not being counted

**Solution:** Ensure add-ons have `status: 'ACTIVE'`:
```typescript
addOns: {
  where: { status: 'ACTIVE' } // ✅ Only count active add-ons
}
```

### Issue: Incorrect workspace plan type

**Solution:** Use the workspace owner's plan, not the current user's plan:
```typescript
// ✅ CORRECT: Use workspace owner's plan
workspacePlanType: workspace.owner.plan

// ❌ WRONG: Use current user's plan
workspacePlanType: currentUser.plan
```

### Issue: Page allocation calculation seems wrong

**Solution:** Remember that `EXTRA_PAGE` adds **5 pages per unit**:
```typescript
// If quantity is 3, it adds 15 pages (3 × 5)
const extraPages = addon.quantity * 5;
```

---

## Future Enhancements

Potential improvements to consider:

1. **Caching:** Cache allocation calculations to reduce database queries
2. **Events:** Emit events when limits are reached for monitoring
3. **Analytics:** Track which plans hit limits most often
4. **Grace Period:** Allow temporary over-limit with warnings
5. **Dynamic Pricing:** Adjust add-on pricing based on plan tier

---

## Support

For questions or issues with the allocation system:
1. Check this guide first
2. Review the test files for usage examples
3. Examine the source code in `src/utils/allocations/`
4. Consult the Prisma schema for data models
