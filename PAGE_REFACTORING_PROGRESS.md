# Page Refactoring Progress Tracker

## 🎯 Project Goal
Refactor all 8 page operation functions to follow ARCHITECTURE.md standards:
- Eliminate 21 over-abstracted helper files in `src/helpers/page/`
- Implement centralized PermissionManager for all permission checks
- Apply FunnelPageAllocations for page limit enforcement
- Standardize cache invalidation strategy
- Write comprehensive tests using TDD approach
- Maintain existing response types (no breaking changes)

## 📊 Overall Progress

**Status:** ✅ Phase 1 COMPLETED - Ready for Phase 2
**Started:** 2025-10-08
**Last Updated:** 2025-10-08
**Completion:** 12.5% (1/8 functions completed)

### Functions Overview
- [x] **1. CREATE** - Create new page in funnel (✅ COMPLETED)
- [ ] **2. GET** - Get single page by ID
- [ ] **3. UPDATE** - Update page fields
- [ ] **4. DELETE** - Delete page and reorder
- [ ] **5. DUPLICATE** - Duplicate page within/across funnels
- [ ] **6. REORDER** - Reorder multiple pages
- [ ] **7. GET_PUBLIC_PAGE** - Public page access
- [ ] **8. CREATE_PAGE_VISIT** - Track page visits

---

## Phase 1: CREATE Function ✅ COMPLETED

**Status:** DONE
**Started:** 2025-10-08
**Completed:** 2025-10-08
**Files Modified:** 3/3
**Tests Written:** 18/10+ (exceeded target by 80%!)

### Tasks
- [x] Move `linking-id-generator.helper.ts` to `src/services/page/create/utils/generate-linking-id.ts`
- [x] Replace `checkFunnelEditPermissions` with centralized permission logic (inline)
- [x] Add `FunnelPageAllocations.canCreatePage()` with friendly error messages
- [x] Simplify cache: only delete `workspace:id:funnel:id:full`
- [x] Update service: `src/services/page/create/index.ts`
- [x] Controller unchanged (no modifications needed)
- [x] Create tests: `src/test/page/create-page.test.ts`
- [x] Delete helpers: `src/helpers/page/create/` (3 files removed)

### Test Coverage Achieved (18 tests - ALL PASSING ✅)
- [x] Should reject if user not authenticated
- [x] Should verify funnel exists
- [x] Allow workspace owner to create page
- [x] Allow member with EDIT_PAGES permission
- [x] Reject user without EDIT_PAGES permission
- [x] Reject user who is not workspace member
- [x] Enforce page limit for FREE plan (35 pages)
- [x] Allow page creation when under limit
- [x] Respect EXTRA_PAGE add-ons for increased limits
- [x] Show user-friendly error message with limit details
- [x] Not count inactive add-ons towards limit
- [x] Generate linking ID from page name
- [x] Handle duplicate linking IDs with counter
- [x] Use default name "Page N" when name not provided
- [x] Invalidate funnel cache after page creation
- [x] Handle cache invalidation errors gracefully
- [x] Reject invalid page type / Reject page name longer than 255 chars
- [x] Create page with correct order sequence / Return correct response structure / Handle custom content

### Key Implementation Notes
```typescript
// Permission check pattern
await PermissionManager.requirePermission({
  userId,
  workspaceId,
  action: PermissionAction.CREATE_PAGE
});

// Allocation check pattern
const canCreate = FunnelPageAllocations.canCreatePage(currentCount, {
  workspacePlanType: workspace.planType,
  addOns: workspace.addOns
});

if (!canCreate) {
  const summary = FunnelPageAllocations.getAllocationSummary(currentCount, input);
  throw new BadRequestError(
    `Your funnel has reached its page limit (${summary.totalAllocation} pages). ` +
    `You have ${summary.baseAllocation} base pages` +
    (summary.extraFromAddOns > 0 ? ` + ${summary.extraFromAddOns} from add-ons. ` : '. ') +
    `Upgrade your plan or purchase page add-ons to create more pages.`
  );
}

// Cache invalidation pattern
await cacheService.del(`workspace:${workspaceId}:funnel:${funnelId}:full`);
```

### Files to Modify
1. **Service:** [src/services/page/create/index.ts](src/services/page/create/index.ts)
2. **Controller:** [src/controllers/page/create/index.ts](src/controllers/page/create/index.ts)
3. **New Utils:** `src/services/page/create/utils/generate-linking-id.ts`
4. **Tests:** `src/test/page/create-page.test.ts`

### Files to Delete (after completion)
- [src/helpers/page/create/permission-check.helper.ts](src/helpers/page/create/permission-check.helper.ts)
- [src/helpers/page/create/linking-id-generator.helper.ts](src/helpers/page/create/linking-id-generator.helper.ts) (move first)
- [src/helpers/page/create/index.ts](src/helpers/page/create/index.ts)

---

## Phase 2: GET Function ⏸️ NOT STARTED

**Status:** Pending Phase 1 completion

### Tasks
- [ ] Replace `checkFunnelViewPermissions` with `PermissionManager`
- [ ] Implement cache-first pattern after permission check
- [ ] Update service and controller
- [ ] Write 8+ tests
- [ ] Delete helpers (2 files)

### Test Coverage Requirements (8+ tests)
- [ ] Authentication validation
- [ ] Permission validation (VIEW_PAGE)
- [ ] Page not found scenario
- [ ] Cache hit scenario
- [ ] Cache miss + DB query + cache set
- [ ] Funnel not found
- [ ] Workspace not found
- [ ] Success with all fields returned

---

## Phase 3: UPDATE Function ⏸️ NOT STARTED

**Status:** Pending Phase 2 completion

### Tasks
- [ ] Replace permission helper with PermissionManager
- [ ] Move linking ID logic inline (only 2 functions use it)
- [ ] Simplify cache invalidation
- [ ] Update service and controller
- [ ] Write 10+ tests
- [ ] Delete helpers (2 files)

### Test Coverage Requirements (10+ tests)
- [ ] Authentication validation
- [ ] Permission validation (EDIT_PAGE)
- [ ] Page not found
- [ ] Update name only
- [ ] Update content only
- [ ] Update SEO fields
- [ ] Update with linking ID conflict
- [ ] Auto-generate linking ID from name
- [ ] No changes provided
- [ ] Cache invalidation check
- [ ] Success with all fields

---

## Phase 4: DELETE Function ⏸️ NOT STARTED

**Status:** Pending Phase 3 completion

### Tasks
- [ ] Replace permission helper with PermissionManager
- [ ] Add "last page" validation with friendly error
- [ ] Simplify cache invalidation
- [ ] Update service and controller
- [ ] Write 8+ tests
- [ ] Delete helpers (3 files)

### Test Coverage Requirements (8+ tests)
- [ ] Authentication validation
- [ ] Permission validation (DELETE_PAGE)
- [ ] Page not found
- [ ] Cannot delete last page in funnel (friendly error)
- [ ] Delete and reorder remaining pages
- [ ] Cache invalidation check
- [ ] Transaction rollback on error
- [ ] Success with reordering

---

## Phase 5: DUPLICATE Function ⏸️ NOT STARTED

**Status:** Pending Phase 4 completion

### Tasks
- [ ] Replace permission helper with PermissionManager
- [ ] Add FunnelPageAllocations check for target funnel
- [ ] Move linking-id to shared util if needed
- [ ] Simplify cache invalidation (both funnels)
- [ ] Update service and controller
- [ ] Write 12+ tests
- [ ] Delete helpers (4 files)

### Test Coverage Requirements (12+ tests)
- [ ] Authentication validation
- [ ] Permission validation (source and target)
- [ ] Source page not found
- [ ] Target funnel not found
- [ ] Target funnel page limit reached
- [ ] Duplicate in same funnel (with " (copy)")
- [ ] Duplicate to different funnel
- [ ] Duplicate with reordering in same funnel
- [ ] Duplicate to different workspace
- [ ] Linking ID uniqueness
- [ ] Cache invalidation for both funnels
- [ ] Success all scenarios

---

## Phase 6: REORDER Function ⏸️ NOT STARTED

**Status:** Pending Phase 5 completion

### Tasks
- [ ] Replace permission helper with PermissionManager
- [ ] Simplify cache invalidation
- [ ] Update service and controller
- [ ] Write 8+ tests
- [ ] Delete helpers (3 files)

### Test Coverage Requirements (8+ tests)
- [ ] Authentication validation
- [ ] Permission validation (REORDER_PAGE)
- [ ] Funnel not found
- [ ] Duplicate order values
- [ ] Non-sequential order values
- [ ] Missing pages in order array
- [ ] Cache invalidation check
- [ ] Success with all pages reordered

---

## Phase 7: GET_PUBLIC_PAGE Function ⏸️ NOT STARTED

**Status:** Pending Phase 6 completion

### Tasks
- [ ] Implement cache-first pattern (no permissions)
- [ ] Update service and controller
- [ ] Write 6+ tests
- [ ] Clean up any helpers if exist

### Test Coverage Requirements (6+ tests)
- [ ] Page not found
- [ ] Funnel not found
- [ ] Locked funnel check
- [ ] Cache hit scenario
- [ ] Cache miss + DB query
- [ ] Success with public page

---

## Phase 8: CREATE_PAGE_VISIT Function ⏸️ NOT STARTED

**Status:** Pending Phase 7 completion

### Tasks
- [ ] Move helper logic inline
- [ ] Optimize cache updates for analytics
- [ ] Update service and controller
- [ ] Write 6+ tests
- [ ] Delete helpers (4 files)

### Test Coverage Requirements (6+ tests)
- [ ] Page not found
- [ ] Session tracking logic
- [ ] Duplicate visit prevention
- [ ] Visit count increment
- [ ] Cache updates
- [ ] Success with analytics tracking

---

## 🗂️ Architecture Patterns Reference

### Permission Check Pattern (All Functions)
```typescript
// Service layer - get workspace info first
const page = await prisma.page.findUnique({
  where: { id: pageId },
  include: { funnel: { include: { workspace: true } } }
});

// Check permission
await PermissionManager.requirePermission({
  userId,
  workspaceId: page.funnel.workspaceId,
  action: PermissionAction.CREATE_PAGE // or EDIT_PAGE, DELETE_PAGE, etc.
});
```

### Allocation Check Pattern (Create/Duplicate)
```typescript
// Get current count
const currentPageCount = await prisma.page.count({
  where: { funnelId }
});

// Check if can create
const canCreate = FunnelPageAllocations.canCreatePage(currentPageCount, {
  workspacePlanType: workspace.planType,
  addOns: workspace.addOns
});

if (!canCreate) {
  const summary = FunnelPageAllocations.getAllocationSummary(currentPageCount, {
    workspacePlanType: workspace.planType,
    addOns: workspace.addOns
  });

  throw new BadRequestError(
    `Your funnel has reached its page limit (${summary.totalAllocation} pages). ` +
    `You have ${summary.baseAllocation} base pages` +
    (summary.extraFromAddOns > 0 ? ` + ${summary.extraFromAddOns} from add-ons. ` : '. ') +
    `Upgrade your plan or contact support to add more pages.`
  );
}
```

### Cache Invalidation Pattern (POST/PUT/DELETE)
```typescript
// Simply delete the funnel full cache key
await cacheService.del(`workspace:${workspaceId}:funnel:${funnelId}:full`);

// For duplicate across funnels, invalidate both
await Promise.all([
  cacheService.del(`workspace:${sourceWorkspaceId}:funnel:${sourceFunnelId}:full`),
  cacheService.del(`workspace:${targetWorkspaceId}:funnel:${targetFunnelId}:full`)
]);
```

### Cache-First Pattern (GET operations)
```typescript
// 1. Check permissions first
await PermissionManager.requirePermission({...});

// 2. Try cache
const cacheKey = `workspace:${workspaceId}:funnel:${funnelId}:full`;
const cached = await cacheService.get(cacheKey);

if (cached) {
  return cached; // Return from cache
}

// 3. Query DB
const data = await prisma.page.findUnique({
  where: { id: pageId },
  select: { /* all fields */ }
});

// 4. Cache for future requests
await cacheService.set(cacheKey, data, { ttl: 0 });

return data;
```

---

## 📁 File Structure After Refactoring

### What Stays
```
src/
├── controllers/page/
│   ├── create/index.ts
│   ├── get/index.ts
│   ├── update/index.ts
│   ├── delete/index.ts
│   ├── duplicate/index.ts
│   ├── reorder/index.ts
│   ├── getPublicPage/index.ts
│   └── createPageVisit/index.ts
├── services/page/
│   ├── create/
│   │   ├── index.ts
│   │   └── utils/generate-linking-id.ts (moved from helpers)
│   ├── get/index.ts
│   ├── update/index.ts
│   ├── delete/index.ts
│   ├── duplicate/index.ts (may use shared linking-id util)
│   ├── reorder/index.ts
│   ├── getPublicPage/index.ts
│   └── createPageVisit/index.ts
├── types/page/
│   └── [all existing type files stay unchanged]
├── test/page/
│   ├── create-page.test.ts (NEW)
│   ├── get-page.test.ts (NEW)
│   ├── update-page.test.ts (NEW)
│   ├── delete-page.test.ts (NEW)
│   ├── duplicate-page.test.ts (NEW)
│   ├── reorder-pages.test.ts (NEW)
│   ├── get-public-page.test.ts (NEW)
│   └── create-page-visit.test.ts (NEW)
└── utils/
    ├── page-utils/
    │   └── linking-id/ (NEW - if needed by 2+ functions)
    │       └── index.ts
    ├── allocations/
    │   └── funnel-page-allocations/ (EXISTS - use it!)
    └── workspace-utils/
        └── workspace-permission-manager/ (EXISTS - use it!)
```

### What Gets Deleted
```
src/helpers/page/ (DELETE ENTIRE DIRECTORY - 21 files)
├── create/ (3 files)
├── get/ (2 files)
├── update/ (2 files)
├── delete/ (3 files)
├── duplicate/ (4 files)
├── reorder/ (3 files)
└── createPageVisit/ (4 files)
```

---

## 🔗 Related Resources

### Key Files to Reference
- **Architecture Standards:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Permission System:** [src/utils/workspace-utils/workspace-permission-manager/](src/utils/workspace-utils/workspace-permission-manager/)
- **Page Allocations:** [src/utils/allocations/funnel-page-allocations/](src/utils/allocations/funnel-page-allocations/)
- **Cache Service:** [src/services/cache/cache.service.ts](src/services/cache/cache.service.ts)
- **Plan Details:** [next_plan.md](next_plan.md)

### Permission Actions Available
- `PermissionAction.CREATE_PAGE`
- `PermissionAction.VIEW_PAGE`
- `PermissionAction.EDIT_PAGE`
- `PermissionAction.DELETE_PAGE`
- `PermissionAction.DUPLICATE_PAGE`
- `PermissionAction.REORDER_PAGE`

### Allocation Methods Available
- `FunnelPageAllocations.canCreatePage(currentCount, input)`
- `FunnelPageAllocations.getRemainingSlots(currentCount, input)`
- `FunnelPageAllocations.getAllocationSummary(currentCount, input)`

---

## 📝 Implementation Checklist

### Before Starting Each Function
- [ ] Read existing service code
- [ ] Read existing controller code
- [ ] Read existing helper files
- [ ] Identify all Prisma queries
- [ ] Identify cache patterns used
- [ ] Identify permission checks
- [ ] Plan test scenarios

### During Implementation
- [ ] Write tests FIRST (TDD approach)
- [ ] Update service with new patterns
- [ ] Update controller if needed
- [ ] Run tests and fix issues
- [ ] Verify all tests pass
- [ ] Delete helper files

### After Completing Each Function
- [ ] Update this progress doc
- [ ] Mark function as ✅ DONE
- [ ] Update test count
- [ ] Commit changes with descriptive message
- [ ] Move to next function

---

## 🚀 Current Status

**Currently Working On:** ✅ Phase 1 COMPLETED
**Next Step:** Ready to start Phase 2 (GET Function) or any other phase
**Blocked By:** None
**Issues Found:** None - All tests passing!

---

## 📊 Statistics

### Progress Metrics
- **Functions Completed:** 1/8 (12.5%)
- **Tests Written:** 18/60+ target (30% of total target achieved)
- **Helper Files Deleted:** 3/21 (14.3%)
- **Services Refactored:** 1/8 (12.5%)
- **Controllers Refactored:** 0/8 (0% - CREATE didn't need changes)

### Code Quality
- **Permission Checks Centralized:** 1/8 (12.5%)
- **Allocation Limits Applied:** 1/2 (create ✅, duplicate pending)
- **Cache Pattern Standardized:** 1/8 (12.5%)
- **User-Friendly Errors:** 1/8 (12.5%)

---

## 🎯 Success Criteria (Final)

When all phases complete, verify:
- [x] Created this comprehensive tracking document
- [x] ✅ Phase 1: DELETE 3/21 helper files (CREATE helpers removed)
- [x] ✅ Phase 1: CREATE uses centralized permission logic (1/8)
- [x] ✅ Phase 1: Page CREATE enforces FunnelPageAllocations (1/2)
- [x] ✅ Phase 1: Simple cache invalidation applied (1/8)
- [x] ✅ Phase 1: 18 comprehensive tests written and passing
- [x] ✅ Phase 1: Existing response types maintained (no breaking changes)
- [x] ✅ Phase 1: User-friendly error messages with allocation details
- [ ] All routes updated in ARCHITECTURE.md as DONE
- [ ] Tests running in CI/CD pipeline

---

**Last Updated:** 2025-10-08 (Phase 1 Completed)
**Next Update:** After Phase 2 completion

---

## 🎓 Notes for Next Agent

### If Resuming Work:
1. Check "Currently Working On" section above
2. Look at "Next Step" for immediate action
3. Review test coverage requirements for current phase
4. Follow architecture patterns in reference section
5. Update this document after each function completion

### Common Patterns to Follow:
- Always check permissions BEFORE any business logic
- Always validate allocations for create/duplicate operations
- Always use user-friendly error messages (not technical jargon)
- Always invalidate cache with simple `del()` pattern
- Always write tests FIRST (TDD approach)

### What NOT to Do:
- ❌ Don't create new helper files in `src/helpers/page/`
- ❌ Don't use legacy permission helpers
- ❌ Don't use complex cache update logic (just invalidate)
- ❌ Don't skip allocation checks in create/duplicate
- ❌ Don't change existing response type structures
- ❌ Don't skip writing tests

Good luck! 🚀
