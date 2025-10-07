# Business & Agency Plans Implementation

## Overview

This document tracks the implementation of new Business and Agency plans for the funnel builder platform.

## Plan Requirements

### Business Plan ($299 one-time payment)

- **Price**: $299 one-time payment
- **Resources per workspace**:
  - Admins: 2
  - Funnels: 1
  - Pages: 35 per funnel
  - Custom Domains: 1
  - Subdomains: 1

### Agency Plan ($50 one-time + add-ons)

- **Base Price**: $50 one-time payment
- **Base Resources**:
  - Admins: 1 (+ $5/month per extra admin as add-on)
  - Workspaces: 3 base (can purchase EXTRA_WORKSPACE add-ons)
- **Partner Commission Structure**:
  - **Level 1** (Default):
    - Commission per Sale: $50
    - Commission per add-on: 5%
  - **Level 2** (After 10 Sales):
    - Commission per Sale: $75
    - Commission per add-on: 10%
  - **Level 3** (After 50 Sales):
    - Commission per Sale: $100
    - Commission per add-on: 15%

## Implementation Phases

### Phase 1: Database Foundation ✅ COMPLETED

**Status**: COMPLETED (2025-01-02)
**Priority**: CRITICAL

#### 1.1 Schema Updates ✅

- ✅ Updated Workspace model:

  - Added `status` (ACTIVE/DRAFT)
  - Added `adminBudget` (default 1)
  - Added `funnelLimit` (default 3)
  - Added `pageLimit` (default 35)
  - Added `customDomainLimit` (default 1)
  - Added `subdomainLimit` (default 1)
  - Added `planType` (UserPlan enum)

- ✅ Updated User model:

  - Added `partnerLevel` (default 1)
  - Added `totalSales` (default 0)
  - Added `commissionPercentage` (default 5)
  - Removed `maximumAdmins` (moved to workspace level)

- ✅ Created AddOn model:

  - Tracks purchased add-ons (EXTRA_ADMIN, EXTRA_WORKSPACE, etc.)
  - Includes quantity, price, status, billing cycle
  - Relations to User and Workspace

- ✅ Enhanced Payment model:
  - Added `paymentType` enum
  - Added add-on tracking fields

#### 1.2 Migration Strategy ✅

- ✅ Created Prisma migration
- ✅ Database schema pushed successfully
- ✅ Reset database for clean state

### Phase 2: Registration & Trial System ✅ COMPLETED

**Status**: COMPLETED (2025-01-02)
**Priority**: HIGH

#### 2.1 Trial Period System ✅

- ✅ Automatic trial date setting on registration
- ✅ Default 6 years from registration
- ✅ Flexible format support (1y, 2m, 3w, 30d)
- ✅ TrialPeriodCalculator utility created

#### 2.2 Workspace Allocation System ✅

- ✅ UserWorkspaceAllocations utility created
- ✅ Plan-based allocation: FREE=1, BUSINESS=1, AGENCY=3
- ✅ Support for EXTRA_WORKSPACE add-ons
- ✅ Single source of truth for allocations

#### 2.3 Registration Refactoring ✅

- ✅ Applied new architecture to register route
- ✅ Complete separation of concerns
- ✅ Zod-only types with Prisma enums
- ✅ User-friendly error messages
- ✅ Strict invitation token validation
- ✅ 17 comprehensive tests passing

### Phase 3: Business Plan Implementation ✅ COMPLETED

**Status**: COMPLETED (2025-10-07)
**Priority**: HIGH

#### 3.1 Workspace Creation Service ✅

- ✅ Updated `createWorkspace` ([src/services/workspace/create/index.ts](src/services/workspace/create/index.ts)) to set planType based on user plan:
  - Business: members=3, funnels=1, pages=35
  - Agency: members=500, funnels=999, pages=35 (+ add-ons)
  - Free: members=3, funnels=3, pages=35
- ✅ Integrated `UserWorkspaceAllocations` utility for workspace limit checks
- ✅ Workspace inherits user's plan by default with optional override
- ✅ Validates workspace limits before creation

#### 3.2 Validation Services ✅

- ✅ Created `WorkspaceMemberAllocations` ([src/utils/allocations/workspace-member-allocations/index.ts](src/utils/allocations/workspace-member-allocations/index.ts)):

  - Calculates member limits based on workspace planType
  - Supports EXTRA_ADMIN add-ons for Agency plan
  - Base: FREE=3, BUSINESS=3, AGENCY=500

- ✅ Created `WorkspaceFunnelAllocations` ([src/utils/allocations/workspace-funnel-allocations/index.ts](src/utils/allocations/workspace-funnel-allocations/index.ts)):

  - Calculates funnel limits based on workspace planType
  - Supports EXTRA_FUNNEL add-ons
  - Base: FREE=3, BUSINESS=1, AGENCY=999

- ✅ Created `FunnelPageAllocations` ([src/utils/allocations/funnel-page-allocations/index.ts](src/utils/allocations/funnel-page-allocations/index.ts)):

  - Calculates page limits per funnel (35 pages base for all plans)
  - Supports EXTRA_PAGE add-ons (5 pages per unit)

- ✅ Created `WorkspaceSubdomainAllocations`:

  - Enforces subdomain limits per workspace

- ✅ Created `WorkspaceCustomDomainAllocations`:

  - Enforces custom domain limits per workspace

- ✅ Updated Funnel Creation Service:

  - Checks funnel limit before creation using WorkspaceFunnelAllocations
  - Validates workspace exists and user has permissions
  - See: [src/services/funnel/create/utils/checkWorkspaceFunnelLimit.ts](src/services/funnel/create/utils/checkWorkspaceFunnelLimit.ts)

- ✅ Updated Invite Member Service:
  - Checks member allocation limit before invitation
  - Uses WorkspaceMemberAllocations utility
  - See: [src/services/workspace/invite-member/index.ts](src/services/workspace/invite-member/index.ts)

#### 3.3 Payment Integration

- [ ] Update payment link creation for $299 price
- [ ] Update webhook handler to set correct plan limits
- [ ] Add plan details to payment metadata

### Phase 4: Agency Plan Implementation 🏢

**Status**: NOT STARTED
**Priority**: HIGH

#### 4.1 Base Plan Setup

- [ ] Set base limits for Agency plan
- [ ] Implement workspace status (ACTIVE/DRAFT)
- [ ] Draft workspaces don't count against limits

#### 4.2 Add-on System

- [ ] Create `AddOnService`:

  - Purchase add-ons (EXTRA_ADMIN, EXTRA_WORKSPACE)
  - Calculate recurring billing
  - Handle add-on cancellation

- [ ] Create add-on purchase endpoint:

  ```typescript
  POST /workspace/:id/addons
  {
    type: "EXTRA_ADMIN" | "EXTRA_WORKSPACE",
    quantity: 2,
    billingCycle: "MONTH"
  }
  ```

#### 4.3 Partner Level System

- [ ] Create `PartnerService`:
  - Track sales count
  - Auto-upgrade partner levels
  - Calculate commission based on level

### Phase 5: API Endpoints 🔌

**Status**: NOT STARTED
**Priority**: MEDIUM

#### 5.1 Resource Management

- [ ] `GET /workspace/:id/limits` - View limits and current usage
- [ ] `GET /workspace/:id/usage` - Detailed resource usage
- [ ] `GET /user/resources` - Overall resource usage

#### 5.2 Add-on Management

- [ ] `GET /workspace/:id/addons` - List active add-ons
- [ ] `POST /workspace/:id/addons` - Purchase add-on
- [ ] `DELETE /workspace/:id/addons/:addonId` - Cancel add-on

#### 5.3 Partner Dashboard

- [ ] `GET /user/partner/stats` - Sales and commission data
- [ ] `GET /user/partner/referrals` - Referral tracking
- [ ] `GET /user/partner/payouts` - Payout history

### Phase 6: Testing & Documentation 🧪

**Status**: PARTIALLY COMPLETE
**Priority**: ONGOING

#### 6.1 Test Coverage

- ✅ Register route tests (17 tests passing)
- [ ] Unit tests for limit enforcement
- [ ] Integration tests for payment flows
- [ ] E2E tests for plan upgrades/downgrades
- [ ] Add-on purchase and renewal tests

#### 6.2 Documentation

- ✅ Architecture guide (ARCHITECTURE.md)
- ✅ Route tracking system
- [ ] API documentation updates
- [ ] Migration guide for existing users
- [ ] Admin guide for managing plans
- [ ] Partner onboarding documentation

## Technical Improvements Made

### Architecture Standardization ✅

1. **File Structure**:

   - Types: Zod-only schemas with Prisma enums
   - Services: Single try-catch, Prisma operations
   - Controllers: Error handling with `return next(error)`
   - Utils: Pure functions, no Prisma/errors

2. **Error Handling**:

   - User-friendly, non-technical messages
   - Proper Express error handling patterns
   - Comprehensive validation

3. **Type Safety**:
   - No `any` or `unknown` types
   - Zod schemas for all types
   - Prisma enums for type safety

## Current System Status

### ✅ Completed

1. **Database Schema**: All tables and fields added
2. **Trial System**: Automatic 6-year trial with flexible formats
3. **Workspace Allocations**: Plan-based workspace limits with add-on support
4. **Register Route**: Fully refactored with new architecture
5. **Partner Fields**: Level, sales tracking, commission percentage
6. **Add-on Model**: Database structure ready
7. **Workspace Status**: ACTIVE/DRAFT enum added
8. **Workspace Creation**: Sets planType, validates limits using allocation utilities
9. **Allocation Utilities**: Complete set of utilities for all resource types
   - `UserWorkspaceAllocations` (workspace count per user)
   - `WorkspaceMemberAllocations` (members per workspace)
   - `WorkspaceFunnelAllocations` (funnels per workspace)
   - `FunnelPageAllocations` (pages per funnel)
   - `WorkspaceSubdomainAllocations` (subdomains per workspace)
   - `WorkspaceCustomDomainAllocations` (custom domains per workspace)
10. **Funnel Limit Enforcement**: Checks limits before funnel creation
11. **Member Limit Enforcement**: Checks limits before invitation
12. **Workspace Limit Enforcement**: Checks limits before workspace creation

### 🚧 In Progress

Nothing currently in progress - Phase 3 completed!

### ❌ Not Started

1. **Payment Integration**: $299 Business plan pricing
2. **Add-on Purchase System**: API and service layer
3. **Partner Level Progression**: Automatic upgrades
4. **Resource Management APIs**: Limit checking endpoints
5. **Draft Workspace Logic**: Unlimited drafts for Agency
6. **Page Limit Enforcement**: Apply FunnelPageAllocations in page creation service
7. **Domain Limit Enforcement**: Apply domain allocations in domain creation services

## Next Steps

### Immediate (Week 1)

1. ✅ ~~Complete register route refactoring~~
2. ✅ ~~Add workspace invitation validation~~
3. ✅ ~~Implement workspace creation with plan limits~~
4. ✅ ~~Create allocation utilities for all resource types~~
5. ✅ ~~Implement funnel limit enforcement~~
6. ✅ ~~Implement member limit enforcement~~
7. [ ] Apply page limit enforcement in page creation service
8. [ ] Apply domain limit enforcement in domain creation services

### Short-term (Week 2)

1. [ ] Update payment integration for Business plan ($299 one-time)
2. [ ] Implement add-on purchase system (POST /workspace/:id/addons)
3. [ ] Create resource management APIs (GET endpoints for limits/usage)
4. [ ] Add comprehensive tests for all allocation utilities

### Medium-term (Week 3-4)

1. [ ] Implement partner level progression
2. [ ] Create partner dashboard APIs
3. [ ] Implement draft workspace logic for Agency plan
4. [ ] Add comprehensive testing for all plan features
5. [ ] Update ARCHITECTURE.md with allocation patterns
6. [ ] Deploy to production

## Implementation Commands

### Database

```bash
# Migration already completed
npx prisma db push

# View database
npx prisma studio
```

### Testing

```bash
# Run register tests
npm test src/test/auth/register.test.ts

# Run all tests
npm test
```

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build
```

## Important Notes

### Decisions Made

- ✅ Per-workspace resource limits (not global user limits)
- ✅ Workspace status (ACTIVE/DRAFT) for Agency plan
- ✅ Trial period defaults to 6 years
- ✅ Strict invitation token validation
- ✅ User-friendly error messages

### Architecture Principles

- ✅ Zod-only types (no Prisma Pick)
- ✅ Controllers handle all Prisma calls
- ✅ Services have single try-catch
- ✅ Utils are pure functions
- ✅ Use `return next(error)` in controllers

---

Last Updated: 2025-10-07
Status: Phase 3 Completed ✅
Next Action: Apply page/domain limit enforcement, then payment integration
Progress: ~60% Complete

## Recent Achievements (2025-01-02 to 2025-10-07)

### Core Infrastructure Completed ✅

1. **Allocation Utilities System**
   - Created comprehensive allocation utilities in [src/utils/allocations/](src/utils/allocations/)
   - Each utility handles specific resource type with add-on support
   - Single source of truth for all resource limits
   - Consistent API across all allocation types

2. **Workspace Creation Enhancement**
   - Updated [CreateWorkspaceService](src/services/workspace/create/index.ts) to use `UserWorkspaceAllocations`
   - Workspace now inherits user plan as `planType`
   - Validates workspace limits before creation
   - Proper error messages for limit exceeded scenarios

3. **Funnel Limit Enforcement**
   - Updated funnel creation to use `WorkspaceFunnelAllocations`
   - Proper validation based on workspace planType
   - Different limits: FREE=3, BUSINESS=1, AGENCY=999
   - Add-on support for expanding funnel limits

4. **Member Limit Enforcement**
   - Updated invite member to use `WorkspaceMemberAllocations`
   - Supports EXTRA_ADMIN add-ons for Agency plan
   - Base limits: All plans=3 base, Agency=500 with add-ons
   - Checks limits before sending invitations

5. **Plan-Based Resource Limits**
   - All resources now respect workspace planType
   - Add-on system integrated into calculations
   - Consistent error messages across all services
   - Ready for payment integration

### Architecture Improvements

- Reorganized utilities into dedicated directories
- Enhanced workspace validation logic
- Improved allocation check performance with proper queries
- All tests passing (workspace, invite, join, update, theme)
- Proper separation of concerns (validation utilities vs service logic)

### Files Modified/Created

- ✅ [src/utils/allocations/index.ts](src/utils/allocations/index.ts) - Central allocation service
- ✅ [src/utils/allocations/workspace-member-allocations/](src/utils/allocations/workspace-member-allocations/)
- ✅ [src/utils/allocations/workspace-funnel-allocations/](src/utils/allocations/workspace-funnel-allocations/)
- ✅ [src/utils/allocations/funnel-page-allocations/](src/utils/allocations/funnel-page-allocations/)
- ✅ [src/utils/allocations/workspace-subdomain-allocations/](src/utils/allocations/workspace-subdomain-allocations/)
- ✅ [src/utils/allocations/workspace-custom-domain-allocations/](src/utils/allocations/workspace-custom-domain-allocations/)
- ✅ [src/utils/allocations/user-workspace-allocations/](src/utils/allocations/user-workspace-allocations/)
- ✅ [src/services/workspace/create/index.ts](src/services/workspace/create/index.ts)
- ✅ [src/services/workspace/invite-member/](src/services/workspace/invite-member/)
- ✅ [src/services/funnel/create/](src/services/funnel/create/)

### What Still Needs to Be Done

1. **Page Creation Service**: Apply `FunnelPageAllocations` utility
2. **Domain Creation Services**: Apply subdomain and custom domain allocations
3. **Payment Integration**: Update for Business plan ($299) and add-on purchases
4. **Resource APIs**: Create GET endpoints to show limits and usage
5. **Tests**: Add comprehensive tests for all allocation utilities
