# Pricing System Guide

## 📋 Overview

The pricing system is the **single source of truth** for all payment pricing in the application.

**Location:** `src/utils/pricing/index.ts`

---

## 💰 Pricing Configuration

### Plan Prices (Annual)

```typescript
// Direct users (registered directly on our site)
DIRECT:
  BUSINESS: $999/year
  AGENCY:   $50/year

// Affiliate users (registered via affiliate link)
AFFILIATE:
  BUSINESS: $299/year
  AGENCY:   ❌ NOT ALLOWED
```

### Add-On Prices (Monthly)

```typescript
BUSINESS Plan:
  EXTRA_ADMIN:      $8/month  → +1 member slot
  EXTRA_FUNNEL:     $15/month → +1 funnel
  EXTRA_PAGE:       $10/month → +5 pages per funnel
  EXTRA_DOMAIN:     $12/month → +1 domain slot
  EXTRA_WORKSPACE:  $25/month → +1 workspace

AGENCY Plan:
  EXTRA_ADMIN:      $5/month  → +1 member slot
  EXTRA_FUNNEL:     $10/month → +1 funnel
  EXTRA_PAGE:       $8/month  → +5 pages per funnel
  EXTRA_DOMAIN:     $10/month → +1 domain slot
  EXTRA_WORKSPACE:  $20/month → +1 workspace
```

---

## 🛠️ How to Use

### 1. Get Plan Price

```typescript
import { getPlanPrice } from './utils/pricing';
import { $Enums } from './generated/prisma-client';

const pricing = getPlanPrice(
  $Enums.RegistrationSource.DIRECT,
  $Enums.UserPlan.BUSINESS
);

// Returns:
// {
//   amount: 999,
//   title: "Business Plan",
//   description: "Full access to business features...",
//   frequency: "annually",
//   frequencyInterval: 1,
//   freeTrialPeriodInDays: 0
// }

// Returns null if not allowed
```

### 2. Get Add-On Price

```typescript
import { getAddonPrice } from './utils/pricing';
import { $Enums } from './generated/prisma-client';

const pricing = getAddonPrice(
  $Enums.UserPlan.BUSINESS,
  $Enums.AddOnType.EXTRA_FUNNEL
);

// Returns:
// {
//   amount: 15,
//   title: "Extra Funnel",
//   description: "Add an additional funnel...",
//   frequency: "monthly",
//   frequencyInterval: 1,
//   freeTrialPeriodInDays: 0,
//   effectDescription: "+1 funnel"
// }
```

### 3. Get Metadata (Return URLs)

```typescript
import { getMetadata } from './utils/pricing';

const metadata = getMetadata();

// Returns:
// {
//   returnUrl: "https://digitalsite.com/payment-succeeded",
//   failureReturnUrl: "https://digitalsite.com/payment-failed",
//   termsAndConditionsUrl: "https://digitalsite.com/terms"
// }
```

### 4. Check if Plan is Allowed

```typescript
import { isPlanAllowed } from './utils/pricing';
import { $Enums } from './generated/prisma-client';

const allowed = isPlanAllowed(
  $Enums.RegistrationSource.AFFILIATE,
  $Enums.UserPlan.AGENCY
);
// Returns: false (affiliate users can only buy BUSINESS)

const allowed = isPlanAllowed(
  $Enums.RegistrationSource.AFFILIATE,
  $Enums.UserPlan.BUSINESS
);
// Returns: true
```

### 5. Get Error Message

```typescript
import { getPlanErrorMessage } from './utils/pricing';
import { $Enums } from './generated/prisma-client';

const message = getPlanErrorMessage(
  $Enums.RegistrationSource.AFFILIATE,
  $Enums.UserPlan.AGENCY
);
// Returns: "Users who registered via affiliate link can only purchase
//           the Business Plan. Please select the Business Plan to continue."
```

---

## 📝 Complete Example

```typescript
import {
  getPlanPrice,
  getMetadata,
  isPlanAllowed,
  getPlanErrorMessage
} from './utils/pricing';
import { $Enums } from './generated/prisma-client';
import { getPrisma } from './lib/prisma';

async function createPaymentLink(userId: number, planType: $Enums.UserPlan) {
  const prisma = getPrisma();

  // 1. Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { registrationSource: true }
  });

  if (!user) throw new Error('User not found');

  // 2. Check if plan is allowed
  if (!isPlanAllowed(user.registrationSource, planType)) {
    const errorMessage = getPlanErrorMessage(user.registrationSource, planType);
    throw new Error(errorMessage);
  }

  // 3. Get pricing
  const pricing = getPlanPrice(user.registrationSource, planType);
  const metadata = getMetadata();

  // 4. Create payment link
  const paymentLink = await createMamoPayLink({
    amount: pricing.amount,
    title: pricing.title,
    description: pricing.description,
    frequency: pricing.frequency,
    frequencyInterval: pricing.frequencyInterval,
    freeTrialPeriodInDays: pricing.freeTrialPeriodInDays,
    returnUrl: metadata.returnUrl,
    failureReturnUrl: metadata.failureReturnUrl,
    termsAndConditionsUrl: metadata.termsAndConditionsUrl
  });

  return paymentLink;
}
```

---

## ✏️ How to Update Prices

**To change any price, title, or description, edit ONE place:**

`src/utils/pricing/index.ts` → `const PRICING = { ... }`

```typescript
// Example: Change Business plan price for direct users
const PRICING = {
  plans: {
    DIRECT: {
      BUSINESS: {
        amount: 1299, // ← Change this number
        title: "Business Plan", // ← Or this title
        description: "...", // ← Or this description
        frequency: "annually",
        frequencyInterval: 1,
        freeTrialPeriodInDays: 0,
      },
      // ...
    }
  }
}
```

That's it! All controllers, services, and tests will use the updated price automatically.

---

## 🎯 Key Rules

1. **Always use Prisma $Enums** - Never use string literals
2. **Always check if plan is allowed** - Use `isPlanAllowed()` before creating payment links
3. **Handle null results** - Pricing functions return `null` if not allowed
4. **One source of truth** - Only update prices in `PRICING` constant

---

## 📁 File Structure

```
src/utils/pricing/
├── index.ts           ← Main pricing config + helper functions (edit this to update prices)
├── types.ts           ← TypeScript types and Zod schemas
└── PRICING_GUIDE.md   ← This documentation
```

---

## 🧪 Testing

```bash
npm test -- create-payment-link
```

---

## 💡 Important Notes

- **Workspace purchases** use PLAN_PURCHASE with BUSINESS pricing ($299 for affiliate users)
- **AFFILIATE users** can ONLY purchase BUSINESS plans (not AGENCY)
- **All plans** are annual subscriptions
- **All add-ons** are monthly subscriptions
- **DIRECT users** are users who registered directly on the platform
- **AFFILIATE users** are users who registered via an affiliate link
