# Add-On Payment Link Guide

## Overview

This guide documents the **Add-On Payment Link** functionality, which allows users to purchase add-ons for their workspaces or accounts.

**New Endpoint**: `POST /api/payment/create-addon-payment-link`

---

## What's Different from Plan Purchase?

| Feature | Plan Purchase | Add-On Purchase |
|---------|--------------|-----------------|
| Endpoint | `/api/payment/create-payment-link` | `/api/payment/create-addon-payment-link` |
| Payment Type | `PLAN_PURCHASE` | `ADDON_PURCHASE` |
| Type Field | `planType` (BUSINESS/AGENCY) | `addonType` (EXTRA_ADMIN/EXTRA_FUNNEL/etc) |
| Workspace ID | Not required | Required for workspace addons |
| Quantity | Not supported | Supported (defaults to 1) |
| Pricing Frequency | Annually | Monthly |

---

## Add-On Types

### Workspace-Level Add-Ons
These require a `workspaceId` in the request:

1. **EXTRA_ADMIN** - Add extra team member
   - BUSINESS: $10/month
   - AGENCY: $5/month

2. **EXTRA_FUNNEL** - Add extra funnel
   - BUSINESS: $15/month
   - AGENCY: ❌ Not allowed

3. **EXTRA_PAGE** - Add 5 extra pages per funnel
   - BUSINESS: $10/month
   - AGENCY: ❌ Not allowed

4. **EXTRA_DOMAIN** - Add extra domain slot
   - BUSINESS: $5/month
   - AGENCY: ❌ Not allowed

### User-Level Add-Ons
These do NOT require a `workspaceId`:

5. **EXTRA_WORKSPACE** - Add extra workspace slot
   - BUSINESS: $25/month
   - AGENCY: $20/month

---

## API Request Format

### Workspace-Level Addon (e.g., EXTRA_FUNNEL)

```bash
POST /api/payment/create-addon-payment-link
Authorization: Bearer <user-jwt-token>
Content-Type: application/json

{
  "paymentType": "ADDON_PURCHASE",
  "addonType": "EXTRA_FUNNEL",
  "workspaceId": 123,
  "quantity": 2
}
```

### User-Level Addon (e.g., EXTRA_WORKSPACE)

```bash
POST /api/payment/create-addon-payment-link
Authorization: Bearer <user-jwt-token>
Content-Type: application/json

{
  "paymentType": "ADDON_PURCHASE",
  "addonType": "EXTRA_WORKSPACE",
  "quantity": 1
}
```

---

## API Response Format

```json
{
  "message": "Add-on payment link created successfully",
  "paymentLink": {
    "id": "mamopay_addon_123",
    "url": "https://mamopay.com/pay/addon123",
    "paymentUrl": "https://mamopay.com/checkout/addon123",
    "title": "Extra Funnel x2",
    "description": "Add an additional funnel to your Business workspace",
    "amount": 30,
    "currency": "USD",
    "frequency": "monthly",
    "frequencyInterval": 1,
    "trialPeriodDays": 0,
    "active": true,
    "createdDate": "2025-10-17T09:00:00.000Z",
    "addonType": "EXTRA_FUNNEL",
    "quantity": 2
  }
}
```

---

## Validation Rules

### ✅ Allowed

- **BUSINESS workspace**: Can purchase EXTRA_ADMIN, EXTRA_FUNNEL, EXTRA_PAGE, EXTRA_DOMAIN
- **AGENCY workspace**: Can ONLY purchase EXTRA_ADMIN
- **BUSINESS user**: Can purchase EXTRA_WORKSPACE
- **AGENCY user**: Can purchase EXTRA_WORKSPACE
- User must be **verified**
- User must be **workspace owner** OR have **MANAGE_WORKSPACE permission**
- Quantity must be **positive integer** (≥ 1)

### ❌ Not Allowed

- AGENCY workspace purchasing EXTRA_FUNNEL, EXTRA_PAGE, or EXTRA_DOMAIN
- Workspace addon without `workspaceId`
- User addon (EXTRA_WORKSPACE) with `workspaceId`
- Unverified users
- Users without workspace permission
- Zero or negative quantity

---

## Error Messages

### Missing workspaceId for workspace addon
```json
{
  "error": "Workspace ID is required for workspace-level add-ons (EXTRA_ADMIN, EXTRA_FUNNEL, EXTRA_PAGE, EXTRA_DOMAIN)."
}
```

### workspaceId provided for user addon
```json
{
  "error": "Workspace ID should not be provided for user-level add-ons (EXTRA_WORKSPACE)."
}
```

### Workspace not found or no permission
```json
{
  "error": "Workspace not found or you don't have permission to purchase add-ons for this workspace. You must be the owner or have MANAGE_WORKSPACE permission."
}
```

### Addon not allowed for plan type
```json
{
  "error": "Additional funnels are not available for your workspace."
}
```

### User not verified
```json
{
  "error": "Please verify your email address before purchasing add-ons. Check your inbox for the verification email."
}
```

---

## MamoPay Custom Data Structure

The payment link includes custom data for webhook processing:

```json
{
  "custom_data": {
    "details": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "addonType": "EXTRA_FUNNEL",
      "paymentType": "ADDON_PURCHASE",
      "quantity": 2,
      "frequency": "monthly",
      "frequencyInterval": 1,
      "trialDays": 0,
      "trialEndDate": "2025-10-17T09:00:00.000Z",
      "workspaceId": 123,          // Only for workspace addons
      "workspaceName": "My Workspace"  // Only for workspace addons
    }
  }
}
```

---

## Testing

### Run Add-On Payment Link Tests
```bash
npm test -- create-addon-payment-link.test.ts
```

### Test Coverage
- 17 comprehensive integration tests
- Workspace-level addons for BUSINESS plan (4 tests)
- Workspace-level addons for AGENCY plan (4 tests)
- User-level addons (2 tests)
- Validation tests (7 tests)
- Error handling tests (1 test)

---

## Files Created

### New Files (4)
1. `src/types/payment/create-addon-payment-link/index.ts` - Type definitions and Zod schemas
2. `src/services/payment/create-addon-payment-link/index.ts` - Business logic for addon payment links
3. `src/controllers/payment/create-addon-payment-link/index.ts` - Request handling and validation
4. `src/test/payment/create-addon-payment-link.test.ts` - Comprehensive integration tests

### Modified Files (2)
1. `src/routes/payment.ts` - Added new endpoint route
2. `ARCHITECTURE.md` - Updated documentation

### No Changes To
- Existing plan purchase functionality (`create-payment-link`)
- Pricing configuration (`src/utils/pricing/index.ts`)
- Database schema

---

## Architecture

The add-on payment link follows the same clean architecture as plan purchases:

```
Controller (validation, auth check)
    ↓
Pricing Service (get addon pricing)
    ↓
Business Service (build MamoPay payload)
    ↓
MamoPay API (create payment link)
    ↓
Response to client
```

All pricing is centralized in `src/utils/pricing/index.ts` using:
- `PaymentLinkPricing.getWorkspaceAddonPricing()` for workspace addons
- `PaymentLinkPricing.getUserAddonPricing()` for user addons

---

## Next Steps (Webhook Implementation)

When the payment is completed, the **webhook** should:
1. Create a `Payment` record with `paymentType = "ADDON_PURCHASE"`
2. Create an `AddOn` record linked to the workspace or user
3. Update workspace/user limits based on addon type
4. Create a subscription for recurring billing

---

## Questions?

Refer to:
- [PRICING_GUIDE.md](src/utils/pricing/PRICING_GUIDE.md) for pricing details
- [ARCHITECTURE.md](ARCHITECTURE.md) for overall system design
- [create-addon-payment-link.test.ts](src/test/payment/create-addon-payment-link.test.ts) for usage examples
