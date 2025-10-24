import { generateBilingualEmail, BilingualContent, EmailMetadata } from '../templates/base-template';

export interface SubscriptionCancellationData {
  recipientName: string;
  subscriptionType: string; // e.g., "Business Plan", "Agency Plan", "Extra Workspace"
  itemType: string; // "PLAN" or "ADDON"
  subscriptionId: string;
  endsAt: Date;
  startsAt?: Date;
}

/**
 * Formats a date as "January 15, 2025" in English
 */
function formatDateEnglish(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats a date in Arabic numerals with month name
 */
function formatDateArabic(date: Date): string {
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generates the HTML email for subscription cancellation notification
 */
/**
 * Translates subscription types to Arabic
 */
function translateSubscriptionTypeToArabic(subscriptionType: string): string {
  const translations: Record<string, string> = {
    'Business Plan': 'خطة الأعمال',
    'Agency Plan': 'خطة الوكالة',
    'Free Plan': 'الخطة المجانية',
    'Extra Workspace': 'مساحة عمل إضافية',
    'Additional Team Member': 'عضو فريق إضافي',
    'Additional Funnel': 'مسار تحويل إضافي',
    'Additional Subdomain': 'نطاق فرعي إضافي',
    'Additional Custom Domain': 'نطاق مخصص إضافي',
    'Plan': 'الخطة',
    'Add-on': 'الإضافة',
  };
  return translations[subscriptionType] || subscriptionType;
}

export function getSubscriptionCancellationEmailHtml(data: SubscriptionCancellationData): string {
  const endDateEnglish = formatDateEnglish(data.endsAt);
  const endDateArabic = formatDateArabic(data.endsAt);

  // Determine item type label
  const itemTypeEnglish = data.itemType === 'PLAN' ? 'Plan' : 'Add-on';
  const itemTypeArabic = data.itemType === 'PLAN' ? 'الخطة' : 'الإضافة';

  // Translate subscription type to Arabic
  const subscriptionTypeArabic = translateSubscriptionTypeToArabic(data.subscriptionType);

  const content: BilingualContent = {
    english: {
      greeting: `Hello ${data.recipientName},`,
      mainContent: `Your ${data.subscriptionType} subscription has been cancelled. You will retain full access to all features until ${endDateEnglish}.`,
      additionalInfo: `
        <div style="margin-top: 24px; padding: 20px; background-color: #F9F9F9; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #000000;">Subscription Details</p>
          <p style="margin: 4px 0; color: #000000; font-size: 14px;"><strong>Type:</strong> ${data.subscriptionType} (${itemTypeEnglish})</p>
          <p style="margin: 4px 0; color: #000000; font-size: 14px;"><strong>Reference:</strong> ${data.subscriptionId}</p>
          <p style="margin: 4px 0; color: #000000; font-size: 14px;"><strong>Access Until:</strong> ${endDateEnglish}</p>
        </div>
        <p style="margin-top: 20px; color: #000000; font-size: 14px;">After ${endDateEnglish}, your subscription will expire and you will no longer have access to the features included in this subscription.</p>
        <p style="margin-top: 12px; color: #000000; font-size: 14px;">You can reactivate your subscription at any time before it expires.</p>
      `,
    },
    arabic: {
      greeting: `مرحبًا ${data.recipientName}،`,
      mainContent: `تم إلغاء اشتراكك في ${subscriptionTypeArabic}. ستحتفظ بإمكانية الوصول الكاملة إلى جميع الميزات حتى ${endDateArabic}.`,
      additionalInfo: `
        <div style="margin-top: 24px; padding: 20px; background-color: #F9F9F9; border-radius: 4px; direction: rtl; text-align: right;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #000000;">تفاصيل الاشتراك</p>
          <p style="margin: 4px 0; color: #000000; font-size: 14px;"><strong>النوع:</strong> ${subscriptionTypeArabic} (${itemTypeArabic})</p>
          <p style="margin: 4px 0; color: #000000; font-size: 14px;"><strong>المرجع:</strong> ${data.subscriptionId}</p>
          <p style="margin: 4px 0; color: #000000; font-size: 14px;"><strong>الوصول حتى:</strong> ${endDateArabic}</p>
        </div>
        <p style="margin-top: 20px; color: #000000; font-size: 14px; direction: rtl; text-align: right;">بعد ${endDateArabic}، ستنتهي صلاحية اشتراكك ولن يكون بإمكانك الوصول إلى الميزات المضمنة في هذا الاشتراك.</p>
        <p style="margin-top: 12px; color: #000000; font-size: 14px; direction: rtl; text-align: right;">يمكنك إعادة تفعيل اشتراكك في أي وقت قبل انتهاء صلاحيته.</p>
      `,
    },
  };

  const metadata: EmailMetadata = {
    subject: 'Subscription Cancelled | تم إلغاء الاشتراك',
    previewText: `Your ${data.subscriptionType} subscription has been cancelled`,
  };

  return generateBilingualEmail(content, metadata);
}

/**
 * Generates the plain text email for subscription cancellation notification
 */
export function getSubscriptionCancellationEmailText(data: SubscriptionCancellationData): string {
  const endDateEnglish = formatDateEnglish(data.endsAt);
  const endDateArabic = formatDateArabic(data.endsAt);
  const itemTypeEnglish = data.itemType === 'PLAN' ? 'Plan' : 'Add-on';
  const itemTypeArabic = data.itemType === 'PLAN' ? 'الخطة' : 'الإضافة';
  const subscriptionTypeArabic = translateSubscriptionTypeToArabic(data.subscriptionType);

  return `
SUBSCRIPTION CANCELLED

Hello ${data.recipientName},

Your ${data.subscriptionType} subscription has been cancelled. You will retain full access to all features until ${endDateEnglish}.

SUBSCRIPTION DETAILS
Type: ${data.subscriptionType} (${itemTypeEnglish})
Reference: ${data.subscriptionId}
Access Until: ${endDateEnglish}

After ${endDateEnglish}, your subscription will expire and you will no longer have access to the features included in this subscription.

You can reactivate your subscription at any time before it expires.

---

تم إلغاء الاشتراك

مرحبًا ${data.recipientName}،

تم إلغاء اشتراكك في ${subscriptionTypeArabic}. ستحتفظ بإمكانية الوصول الكاملة إلى جميع الميزات حتى ${endDateArabic}.

تفاصيل الاشتراك
النوع: ${subscriptionTypeArabic} (${itemTypeArabic})
المرجع: ${data.subscriptionId}
الوصول حتى: ${endDateArabic}

بعد ${endDateArabic}، ستنتهي صلاحية اشتراكك ولن يكون بإمكانك الوصول إلى الميزات المضمنة في هذا الاشتراك.

يمكنك إعادة تفعيل اشتراكك في أي وقت قبل انتهاء صلاحيته.

---

Best regards,
The Digitalsite Team

مع أطيب التحيات،
فريق Digitalsite

If you need assistance, contact us at ${process.env.SUPPORT_EMAIL || 'support@digitalsite.com'}
إذا كنت بحاجة إلى مساعدة، اتصل بنا على ${process.env.SUPPORT_EMAIL || 'support@digitalsite.com'}
`;
}
