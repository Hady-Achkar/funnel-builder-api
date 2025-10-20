# Email Design & Content Guide

## Purpose
This guide establishes standards for all email communications from Digitalsite. Our emails reflect our brand values: professional, clear, and accessible to both English and Arabic speakers.

---

## Core Principles

### 1. **High-Ticket Professional Design**
- Clean, minimalist aesthetic
- Generous white space
- Sharp, crisp typography
- No decorative elements or cheap design patterns
- Focus on content, not decoration

### 2. **Strict Color Palette**
- **Text:** Black (#000000) ONLY
- **Buttons:** Black background (#000000) with white text (#FFFFFF)
- **Separators:** Light gray (#E5E5E5) for subtle divisions
- **Background:** White (#FFFFFF)
- **NO other colors allowed** (no blues, greens, reds, gradients, etc.)

### 3. **No Emojis or Icons**
- Absolutely NO emojis (🎉 ❌ 💰 etc.)
- NO icon fonts or decorative symbols
- NO celebration elements
- Keep it professional and refined

### 4. **Bilingual by Default**
- All emails MUST include both English and Arabic
- English section appears first
- Arabic section appears second with proper RTL support
- Both languages should convey the same message

### 5. **Clear, Simple Language**
- NO technical jargon
- NO marketing buzzwords
- Short sentences (max 20 words)
- Direct and to the point
- User-focused (what THEY need to do, not what WE offer)

---

## Email Creation Workflow

This section outlines the exact steps an agent (developer) should follow when creating a new email template using this system.

### Step 1: Understand the Email Purpose
Before writing any code, clarify:
- **What is the email for?** (verification, password reset, invitation, notification)
- **What action should the user take?** (click button, read information, complete setup)
- **What information must be included?** (credentials, links, deadlines)
- **Who is the recipient?** (new user, existing user, workspace member)

### Step 2: Define the Email Interface
Create a TypeScript interface for the email data:

```typescript
// Example: src/constants/emails/workspace/new-invitation.ts
export interface WorkspaceInvitationData {
  recipientName: string;
  workspaceName: string;
  inviterName: string;
  role: string;
  invitationUrl: string;
}
```

### Step 3: Write English Content
Write the English version following these rules:
- **Greeting:** Use recipient's name if available, otherwise "Hello"
- **Main message:** 2-3 short sentences (max 20 words each)
- **Call to action:** Clear, action-oriented button text
- **Additional info:** Security notes, expiration dates, support info

**Example:**
```typescript
const englishContent = {
  greeting: `Hello ${data.recipientName},`,
  mainContent: `${data.inviterName} has invited you to join the ${data.workspaceName} workspace as a ${data.role}. Click the button below to accept this invitation.`,
  ctaText: 'Accept Invitation',
  ctaUrl: data.invitationUrl,
  additionalInfo: 'This invitation will expire in 7 days. If you did not expect this invitation, you can ignore this email.'
};
```

**Checklist for English content:**
- [ ] No technical jargon
- [ ] No marketing buzzwords
- [ ] No emojis
- [ ] Clear and direct
- [ ] Action-focused

### Step 4: Create Arabic Translation
Translate the English content to Modern Standard Arabic:
- **Use formal tone** (not colloquial)
- **Translate meaning, not word-for-word** (make it natural)
- **Keep the same structure** (greeting, main, CTA, additional)
- **Get native speaker review** if possible

**Example:**
```typescript
const arabicContent = {
  greeting: `مرحبًا ${data.recipientName}،`,
  mainContent: `قام ${data.inviterName} بدعوتك للانضمام إلى مساحة العمل ${data.workspaceName} بصفة ${data.role}. انقر على الزر أدناه لقبول هذه الدعوة.`,
  ctaText: 'قبول الدعوة',
  ctaUrl: data.invitationUrl,
  additionalInfo: 'ستنتهي صلاحية هذه الدعوة خلال 7 أيام. إذا لم تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد الإلكتروني.'
};
```

**Checklist for Arabic content:**
- [ ] Modern Standard Arabic (not colloquial)
- [ ] Formal tone
- [ ] Natural phrasing (not literal translation)
- [ ] Reviewed by native speaker
- [ ] Same structure as English

### Step 5: Build the Email Using Base Template
Use the `generateBilingualEmail` function from `base-template.ts`:

```typescript
import { generateBilingualEmail, BilingualContent, EmailMetadata } from '../templates/base-template';

export function getWorkspaceInvitationEmail(data: WorkspaceInvitationData): string {
  const content: BilingualContent = {
    english: {
      greeting: `Hello ${data.recipientName},`,
      mainContent: `${data.inviterName} has invited you to join the ${data.workspaceName} workspace as a ${data.role}. Click the button below to accept this invitation.`,
      ctaText: 'Accept Invitation',
      ctaUrl: data.invitationUrl,
      additionalInfo: 'This invitation will expire in 7 days. If you did not expect this invitation, you can ignore this email.'
    },
    arabic: {
      greeting: `مرحبًا ${data.recipientName}،`,
      mainContent: `قام ${data.inviterName} بدعوتك للانضمام إلى مساحة العمل ${data.workspaceName} بصفة ${data.role}. انقر على الزر أدناه لقبول هذه الدعوة.`,
      ctaText: 'قبول الدعوة',
      ctaUrl: data.invitationUrl,
      additionalInfo: 'ستنتهي صلاحية هذه الدعوة خلال 7 أيام. إذا لم تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد الإلكتروني.'
    }
  };

  const metadata: EmailMetadata = {
    subject: 'Workspace Invitation | دعوة إلى مساحة العمل',
    previewText: 'You have been invited to join a workspace'
  };

  return generateBilingualEmail(content, metadata);
}
```

### Step 6: Validate Content
Run the validation function to ensure compliance:

```typescript
import { validateEmailContent } from '../templates/base-template';

try {
  validateEmailContent(content);
  console.log('Email content is valid');
} catch (error) {
  console.error('Validation failed:', error.message);
  // Fix the issues before proceeding
}
```

**Validation checks for:**
- [ ] No emojis in any text
- [ ] No color codes (except black/white)
- [ ] Both languages have all required fields
- [ ] Button text is clear and action-oriented

### Step 7: Send Email Directly Using SendGrid
**NO helper files needed!** Import email functions directly from constants and use SendGrid inline:

```typescript
// In your service/processor/controller file
import sgMail from '@sendgrid/mail';
import {
  getWorkspaceInvitationEmailHtml,
  getWorkspaceInvitationEmailText,
  WorkspaceInvitationData
} from '../constants/emails/workspace/invitation';

// Send email directly in your business logic
try {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is not configured');
  }
  sgMail.setApiKey(apiKey);

  const emailData: WorkspaceInvitationData = {
    recipientName: 'John Doe',
    workspaceName: 'My Workspace',
    inviterName: 'Jane Smith',
    role: 'Editor',
    invitationUrl: 'https://example.com/invite?token=abc'
  };

  await sgMail.send({
    to: 'user@example.com',
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: 'Digitalsite',
    },
    subject: 'Workspace Invitation | دعوة إلى مساحة العمل',
    html: getWorkspaceInvitationEmailHtml(emailData),
    text: getWorkspaceInvitationEmailText(emailData),
  });

  console.log('Email sent successfully');
} catch (error) {
  console.error('Failed to send email:', error);
  // Handle error appropriately
}
```

**Why no helpers?**
- ✅ Simpler architecture - one less layer
- ✅ Email logic visible where it's used
- ✅ Easier to customize per use case
- ✅ No need to create/maintain separate helper files

### Step 8: Test the Email
Perform comprehensive testing:

#### A. Visual Testing
1. **Send test email to yourself**
   ```typescript
   await sendWorkspaceInvitationEmail('your-email@example.com', testData);
   ```
2. **Check in multiple email clients:**
   - Gmail (desktop and mobile)
   - Outlook (desktop and mobile)
   - Apple Mail
   - Yahoo Mail

#### B. Content Checklist
- [ ] English content displays correctly
- [ ] Arabic content displays correctly with RTL
- [ ] No emojis visible
- [ ] Only black and white colors
- [ ] Button is black with white text
- [ ] Button link works correctly
- [ ] All dynamic data populated correctly
- [ ] No broken formatting
- [ ] Mobile responsive

#### C. Functional Testing
- [ ] Click button and verify correct URL
- [ ] Test with missing optional data
- [ ] Test with special characters in data
- [ ] Test with very long text
- [ ] Verify email doesn't go to spam

### Step 9: Code Review
Before committing:

1. **Self-review checklist:**
   - [ ] Follows EMAIL_GUIDE.md standards
   - [ ] Uses base-template.ts functions
   - [ ] TypeScript interfaces properly defined
   - [ ] No hardcoded values
   - [ ] Error handling implemented
   - [ ] Comments for complex logic

2. **Get peer review:**
   - [ ] Another developer reviews code
   - [ ] Native Arabic speaker reviews translation
   - [ ] Test email sent to reviewer

### Step 10: Documentation
Document the new email:

1. **Add to email inventory** (create if doesn't exist):
   ```typescript
   // src/constants/emails/EMAIL_INVENTORY.md
   ## Workspace Invitation Email
   - **Purpose:** Invite user to join workspace
   - **File:** `src/constants/emails/workspace/invitation.ts`
   - **Sender:** `src/helpers/workspace/emails/invitation/index.ts`
   - **Data Required:** recipientName, workspaceName, inviterName, role, invitationUrl
   - **Subject:** "Workspace Invitation | دعوة إلى مساحة العمل"
   ```

2. **Update changelog if applicable**

### Step 11: Deployment
Final steps before production:

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: add workspace invitation bilingual email"
   ```

2. **Push and create PR:**
   ```bash
   git push origin feature/workspace-invitation-email
   # Create PR for review
   ```

3. **After merge, verify in staging:**
   - [ ] Send test email in staging environment
   - [ ] Verify all links point to staging URLs
   - [ ] Test complete user flow

4. **Production deployment:**
   - [ ] Monitor email delivery logs
   - [ ] Check SendGrid dashboard for any issues
   - [ ] Verify user reports no problems

---

## Quick Reference: File Structure
When creating a new email, follow this simplified structure:

```
src/
└── constants/
    └── emails/
        ├── EMAIL_GUIDE.md (this file)
        ├── templates/
        │   └── base-template.ts (shared functions)
        └── [category]/
            └── [email-name].ts (email template with HTML/text functions)
```

**Example:**
```
src/constants/emails/subscription/confirmation.ts
  ↳ Contains: getSubscriptionConfirmationEmailHtml()
  ↳ Contains: getSubscriptionConfirmationEmailText()
  ↳ Import directly in your service/processor/controller
```

**No helper files needed!** Import email functions directly where you send emails.

---

## Layout Structure

Every email follows this structure:

```
┌─────────────────────────────┐
│   HEADER                    │
│   - Company name            │
│   - Simple, clean           │
├─────────────────────────────┤
│   ENGLISH SECTION           │
│   - Greeting                │
│   - Main message            │
│   - Call to action (button) │
├─────────────────────────────┤
│   ARABIC SECTION            │
│   - التحية                 │
│   - الرسالة الرئيسية       │
│   - دعوة لاتخاذ إجراء      │
├─────────────────────────────┤
│   FOOTER                    │
│   - Support info (bilingual)│
│   - Legal text (bilingual)  │
└─────────────────────────────┘
```

---

## Typography Standards

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
             Helvetica, Arial, sans-serif;
```

### English Typography
- **Heading 1:** 28px, Bold (font-weight: 700)
- **Heading 2:** 24px, Semi-bold (font-weight: 600)
- **Body Text:** 16px, Regular (font-weight: 400)
- **Small Text:** 14px, Regular
- **Line Height:** 1.6 (all text)

### Arabic Typography
```css
font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
direction: rtl;
text-align: right;
```
- **Heading 1:** 28px, Bold
- **Heading 2:** 24px, Semi-bold
- **Body Text:** 16px, Regular
- **Line Height:** 1.8 (Arabic needs more spacing)

---

## Button Styling

### Standard Button
```html
<a href="{{url}}" style="
  display: inline-block;
  background-color: #000000;
  color: #FFFFFF;
  text-decoration: none;
  padding: 14px 32px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 16px;
  text-align: center;
  margin: 20px 0;
">
  Action Text
</a>
```

### Button Rules
- Always black background, white text
- One primary button per section (English and Arabic each get one)
- Button text must be action-oriented and clear
- English: "Verify Email", "Reset Password", "Join Workspace"
- Arabic: "تأكيد البريد الإلكتروني", "إعادة تعيين كلمة المرور", "الانضمام إلى مساحة العمل"

---

## Content Writing Guidelines

### English Content

#### DO:
✅ "Click the button below to verify your email address."
✅ "Your account has been created successfully."
✅ "Reset your password by clicking here."
✅ "You have been invited to join a workspace."

#### DON'T:
❌ "We're super excited to have you on board!" (too casual)
❌ "Let's get you started with our amazing platform!" (too marketing-heavy)
❌ "Your onboarding process has been initialized." (technical jargon)
❌ "Leverage our cutting-edge funnel-building capabilities!" (buzzwords)

### Arabic Content

#### Requirements:
- Use Modern Standard Arabic (الفصحى)
- Formal, professional tone
- Accurate translation (not literal, but meaning-equivalent)
- Proper grammar and diacritics where necessary
- RTL (right-to-left) formatting

#### DO:
✅ "انقر على الزر أدناه لتأكيد بريدك الإلكتروني."
✅ "تم إنشاء حسابك بنجاح."
✅ "أعد تعيين كلمة المرور بالنقر هنا."
✅ "تمت دعوتك للانضمام إلى مساحة عمل."

#### DON'T:
❌ Colloquial Arabic (مش، حاجة، etc.)
❌ Machine translations without review
❌ Mixed English/Arabic text in same sentence
❌ Informal pronouns

---

## Email Types & Tone

### 1. Transactional Emails (Verification, Password Reset)
**Tone:** Professional, direct, reassuring
**Goal:** Help user complete an action quickly

### 2. Welcome Emails (Subscription, Onboarding)
**Tone:** Professional, warm (without being casual)
**Goal:** Orient user and provide necessary credentials

### 3. Invitation Emails (Workspace, Team)
**Tone:** Professional, inviting (formal invitation)
**Goal:** Clearly explain what they're invited to and how to join

### 4. Notification Emails (Affiliate success, Updates)
**Tone:** Professional, informative
**Goal:** Convey information clearly without celebration

---

## Responsive Design

### Mobile Considerations
```css
@media (max-width: 600px) {
  /* Reduce padding */
  /* Stack elements vertically */
  /* Increase button size for touch */
  /* Ensure text is readable (min 14px) */
}
```

### Email Client Compatibility
- Test in Gmail, Outlook, Apple Mail, Yahoo
- Avoid complex CSS (use inline styles)
- Use tables for layout (email client standard)
- Provide text alternative

---

## Bilingual Layout Examples

### Example 1: Simple Notification

**English:**
```
Your account has been created successfully.

Click the button below to verify your email address.

[Verify Email Address]

If you did not create this account, please ignore this email.
```

**Arabic:**
```
تم إنشاء حسابك بنجاح.

انقر على الزر أدناه لتأكيد بريدك الإلكتروني.

[تأكيد البريد الإلكتروني]

إذا لم تقم بإنشاء هذا الحساب، يرجى تجاهل هذا البريد الإلكتروني.
```

### Example 2: Credentials Email

**English:**
```
Welcome to Digitalsite.

Your account has been created with the following credentials:

Email: user@example.com
Password: [temporary-password]

For security, please change your password after your first login.

[Set Password]
```

**Arabic:**
```
مرحبًا بك في Digitalsite.

تم إنشاء حسابك باستخدام بيانات الاعتماد التالية:

البريد الإلكتروني: user@example.com
كلمة المرور: [كلمة-مرور-مؤقتة]

لأسباب أمنية، يرجى تغيير كلمة المرور بعد أول تسجيل دخول.

[تعيين كلمة المرور]
```

---

## Common Phrases & Translations

### Special Translation Rules

**IMPORTANT: Never use the word "Funnel" in user-facing content**
- In English: Use "Website" instead of "Funnel"
- In Arabic: Use "الموقع" (website) instead of "مسار" (funnel)
- Rationale: "Funnel" is technical jargon that confuses users. They understand "Website" better.

**Examples:**
- ❌ "Your funnel has been published" → ✅ "Your website has been published"
- ❌ "إضافة مسار" → ✅ "إضافة موقع"
- ❌ "Funnel addon" → ✅ "Website addon"

### Standard Phrases

| English | Arabic |
|---------|--------|
| Welcome | مرحبًا بك |
| Your account has been created | تم إنشاء حسابك |
| Verify your email | تأكيد بريدك الإلكتروني |
| Reset password | إعادة تعيين كلمة المرور |
| Set password | تعيين كلمة المرور |
| Click here | انقر هنا |
| If you did not request this | إذا لم تطلب هذا |
| Ignore this email | تجاهل هذا البريد الإلكتروني |
| For security | لأسباب أمنية |
| Your credentials | بيانات الاعتماد الخاصة بك |
| Login | تسجيل الدخول |
| Join workspace | الانضمام إلى مساحة العمل |
| You have been invited | تمت دعوتك |
| Accept invitation | قبول الدعوة |
| Best regards | مع أطيب التحيات |
| The Digitalsite Team | فريق Digitalsite |
| Website | الموقع |
| Page | الصفحة |
| Domain | النطاق |
| Workspace | مساحة العمل |
| Subdomain | النطاق الفرعي |
| Admin | مدير |

---

## Testing Checklist

Before sending any email:

- [ ] No emojis present
- [ ] Only black and white colors (no blues, greens, etc.)
- [ ] Both English and Arabic sections included
- [ ] Arabic displays correctly (RTL, proper font)
- [ ] No technical jargon
- [ ] Language is clear and simple
- [ ] Buttons are black with white text
- [ ] Mobile responsive
- [ ] Tested in multiple email clients
- [ ] All links work correctly
- [ ] Arabic translation reviewed by native speaker

---

## DO's and DON'Ts Summary

### DO:
✅ Use only black and white
✅ Include both English and Arabic
✅ Write simple, clear sentences
✅ Use professional, formal tone
✅ Focus on user actions
✅ Test in multiple email clients
✅ Use inline CSS for styling
✅ Keep layout clean and spacious

### DON'T:
❌ Use emojis or icons
❌ Use colors (blue, green, gradients, etc.)
❌ Use casual language
❌ Use technical terms
❌ Use marketing buzzwords
❌ Mix languages in same sentence
❌ Use decorative elements
❌ Overcomplicate the design

---

## Support & Questions

If you're creating a new email template:
1. Review this guide thoroughly
2. Use the base template (`base-template.ts`)
3. Write content in plain language
4. Get Arabic translation reviewed
5. Test in multiple email clients
6. Submit for team review

**Remember:** Every email represents our brand. Professional, clear, and accessible to all users.
