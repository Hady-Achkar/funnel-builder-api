# Base Template Usage Examples

This document shows how to use the base email template system to create new emails.

## Quick Start

```typescript
import {
  generateBilingualEmail,
  generateBilingualEmailText,
  BilingualContent,
  EmailMetadata,
} from './base-template';

// Define your content
const content: BilingualContent = {
  english: {
    greeting: "Welcome to Digitalsite",
    mainContent: "Your account has been created successfully.",
    ctaText: "Verify Email",
    ctaUrl: "https://app.digitalsite.com/verify?token=abc123",
    additionalInfo: "If you did not create this account, please ignore this email."
  },
  arabic: {
    greeting: "مرحبًا بك في Digitalsite",
    mainContent: "تم إنشاء حسابك بنجاح.",
    ctaText: "تأكيد البريد الإلكتروني",
    ctaUrl: "https://app.digitalsite.com/verify?token=abc123",
    additionalInfo: "إذا لم تقم بإنشاء هذا الحساب، يرجى تجاهل هذا البريد الإلكتروني."
  }
};

const metadata: EmailMetadata = {
  subject: "Verify Your Email - Digitalsite",
  previewText: "Click to verify your account"
};

// Generate HTML and text versions
const htmlEmail = generateBilingualEmail(content, metadata);
const textEmail = generateBilingualEmailText(content);
```

---

## Example 1: Simple Verification Email

```typescript
import { generateBilingualEmail, BilingualContent } from './base-template';

export function getVerificationEmail(verificationUrl: string): string {
  const content: BilingualContent = {
    english: {
      greeting: "Verify Your Email",
      mainContent: "Please click the button below to verify your email address and activate your account.",
      ctaText: "Verify Email Address",
      ctaUrl: verificationUrl,
      additionalInfo: "This link will expire in 24 hours. If you did not create this account, please ignore this email."
    },
    arabic: {
      greeting: "تأكيد بريدك الإلكتروني",
      mainContent: "يرجى النقر على الزر أدناه لتأكيد بريدك الإلكتروني وتفعيل حسابك.",
      ctaText: "تأكيد البريد الإلكتروني",
      ctaUrl: verificationUrl,
      additionalInfo: "ستنتهي صلاحية هذا الرابط خلال 24 ساعة. إذا لم تقم بإنشاء هذا الحساب، يرجى تجاهل هذا البريد."
    }
  };

  return generateBilingualEmail(content, {
    subject: "Verify Your Email - Digitalsite",
    previewText: "Verify your account to get started"
  });
}
```

---

## Example 2: Password Reset Email

```typescript
import { generateBilingualEmail, BilingualContent } from './base-template';

export function getPasswordResetEmail(resetUrl: string): string {
  const content: BilingualContent = {
    english: {
      greeting: "Reset Your Password",
      mainContent: "You requested to reset your password. Click the button below to create a new password.",
      ctaText: "Reset Password",
      ctaUrl: resetUrl,
      additionalInfo: "If you did not request this, please ignore this email. Your password will remain unchanged."
    },
    arabic: {
      greeting: "إعادة تعيين كلمة المرور",
      mainContent: "لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة.",
      ctaText: "إعادة تعيين كلمة المرور",
      ctaUrl: resetUrl,
      additionalInfo: "إذا لم تطلب هذا، يرجى تجاهل هذا البريد. ستبقى كلمة المرور الخاصة بك دون تغيير."
    }
  };

  return generateBilingualEmail(content, {
    subject: "Reset Your Password - Digitalsite",
    previewText: "Reset your account password"
  });
}
```

---

## Example 3: Welcome Email with Credentials

```typescript
import {
  generateBilingualEmail,
  createCredentialsBox,
  BilingualContent,
} from './base-template';

export function getWelcomeEmail(
  email: string,
  temporaryPassword: string,
  setPasswordUrl: string
): string {
  // Create credentials box (language-neutral)
  const credentialsHtml = createCredentialsBox([
    { label: 'Email / البريد الإلكتروني', value: email },
    { label: 'Password / كلمة المرور', value: temporaryPassword }
  ]);

  const content: BilingualContent = {
    english: {
      greeting: "Welcome to Digitalsite",
      mainContent: `Your account has been created successfully. Here are your login credentials:
        ${credentialsHtml}
        For security, please change your password after your first login.`,
      ctaText: "Set New Password",
      ctaUrl: setPasswordUrl
    },
    arabic: {
      greeting: "مرحبًا بك في Digitalsite",
      mainContent: `تم إنشاء حسابك بنجاح. إليك بيانات تسجيل الدخول الخاصة بك:
        ${credentialsHtml}
        لأسباب أمنية، يرجى تغيير كلمة المرور بعد أول تسجيل دخول.`,
      ctaText: "تعيين كلمة مرور جديدة",
      ctaUrl: setPasswordUrl
    }
  };

  return generateBilingualEmail(content, {
    subject: "Welcome to Digitalsite",
    previewText: "Your account is ready"
  });
}
```

---

## Example 4: Workspace Invitation

```typescript
import { generateBilingualEmail, BilingualContent } from './base-template';

export function getWorkspaceInvitationEmail(
  workspaceName: string,
  role: string,
  invitationUrl: string
): string {
  const content: BilingualContent = {
    english: {
      greeting: "You've Been Invited",
      mainContent: `You have been invited to join the workspace "${workspaceName}" as a ${role}.`,
      ctaText: "Accept Invitation",
      ctaUrl: invitationUrl,
      additionalInfo: "This invitation will expire in 7 days."
    },
    arabic: {
      greeting: "تمت دعوتك",
      mainContent: `تمت دعوتك للانضمام إلى مساحة العمل "${workspaceName}" بصفة ${role}.`,
      ctaText: "قبول الدعوة",
      ctaUrl: invitationUrl,
      additionalInfo: "ستنتهي صلاحية هذه الدعوة خلال 7 أيام."
    }
  };

  return generateBilingualEmail(content, {
    subject: `Invitation to join ${workspaceName}`,
    previewText: "Accept your workspace invitation"
  });
}
```

---

## Example 5: Simple Notification (No Button)

```typescript
import { generateBilingualEmail, BilingualContent } from './base-template';

export function getAffiliateNotificationEmail(): string {
  const content: BilingualContent = {
    english: {
      greeting: "New Referral",
      mainContent: "Someone has successfully subscribed using your affiliate link. Your commission has been added to your account.",
      // No CTA button - just a notification
    },
    arabic: {
      greeting: "إحالة جديدة",
      mainContent: "قام شخص ما بالاشتراك بنجاح باستخدام رابط الإحالة الخاص بك. تم إضافة عمولتك إلى حسابك.",
      // No CTA button - just a notification
    }
  };

  return generateBilingualEmail(content, {
    subject: "New Referral - Commission Earned",
    previewText: "You've earned a commission"
  });
}
```

---

## Using Helper Components

### Credentials Box

```typescript
import { createCredentialsBox } from './base-template';

const credentials = createCredentialsBox([
  { label: 'Email', value: 'user@example.com' },
  { label: 'Username', value: 'johndoe' },
  { label: 'Password', value: 'temp123' }
]);

// Use in your content
const content = {
  english: {
    greeting: "Your Account",
    mainContent: `Here are your credentials: ${credentials}`
  }
  // ...
};
```

### Info Box

```typescript
import { createInfoBox } from './base-template';

const securityNote = createInfoBox(
  "For security reasons, this link will expire in 24 hours."
);

// Use in your content
const content = {
  english: {
    greeting: "Reset Password",
    mainContent: `Click below to reset. ${securityNote}`
  }
  // ...
};
```

---

## Validation

Always validate your content before generating:

```typescript
import { validateEmailContent, BilingualContent } from './base-template';

const content: BilingualContent = {
  // ... your content
};

const validation = validateEmailContent(content);

if (!validation.valid) {
  console.error('Email content validation failed:', validation.errors);
  // Handle errors
} else {
  const html = generateBilingualEmail(content, metadata);
  // Send email
}
```

---

## Common Mistakes to Avoid

### ❌ DON'T: Use emojis
```typescript
{
  greeting: "Welcome! 🎉"  // NO!
}
```

### ✅ DO: Use plain text
```typescript
{
  greeting: "Welcome"  // YES!
}
```

### ❌ DON'T: Use colors in content
```typescript
{
  mainContent: "<span style='color: blue'>Click here</span>"  // NO!
}
```

### ✅ DO: Use plain text (button will be black automatically)
```typescript
{
  mainContent: "Click the button below",
  ctaText: "Click Here"  // Button will be black with white text
}
```

### ❌ DON'T: Mix languages
```typescript
{
  greeting: "مرحبا Welcome"  // NO!
}
```

### ✅ DO: Keep languages separate
```typescript
{
  english: { greeting: "Welcome" },
  arabic: { greeting: "مرحبًا" }
}
```

---

## Testing Your Email

```typescript
import { generateBilingualEmail } from './base-template';

// Generate your email
const html = generateBilingualEmail(content, metadata);

// Test in browser
const fs = require('fs');
fs.writeFileSync('test-email.html', html);

// Open test-email.html in browser to preview
```

---

## SendGrid Integration

```typescript
import sgMail from '@sendgrid/mail';
import { generateBilingualEmail, generateBilingualEmailText } from './base-template';

async function sendEmail(to: string, content: BilingualContent, metadata: EmailMetadata) {
  const html = generateBilingualEmail(content, metadata);
  const text = generateBilingualEmailText(content);

  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: 'Digitalsite',
    },
    subject: metadata.subject,
    html,
    text,
  };

  await sgMail.send(msg);
}
```

---

## Need Help?

1. Check `EMAIL_GUIDE.md` for design principles
2. Review `base-template.ts` for available functions
3. Look at existing implementations in `src/constants/emails/`
4. Test your email in multiple clients before deploying
