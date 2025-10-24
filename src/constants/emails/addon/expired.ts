import {
  generateBilingualEmail,
  BilingualContent,
  EmailMetadata,
} from "../templates/base-template";

export interface AddonExpiredData {
  recipientName: string;
  addonTypeName: string;
  quantity: number;
  expirationDate: Date;
  whatHappened: string; // Description of what was disabled (English)
  whatHappenedArabic: string; // Description of what was disabled (Arabic)
  renewalUrl: string;
}

function formatDateEnglish(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateArabic(date: Date): string {
  return date.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function translateAddonTypeToArabic(addonType: string): string {
  const translations: Record<string, string> = {
    "Extra Workspace": "مساحة عمل إضافية",
    "Extra Website": "موقع إضافي",
    "Extra Funnel": "موقع إضافي",
    "Extra Page": "صفحة إضافية",
    "Extra Subdomain": "نطاق فرعي إضافي",
    "Extra Custom Domain": "نطاق مخصص إضافي",
    "Extra Admin": "مدير إضافي",
    "Additional Team Member": "عضو فريق إضافي",
  };
  return translations[addonType] || addonType;
}

export function getAddonExpiredEmailHtml(data: AddonExpiredData): string {
  const expirationDateEnglish = formatDateEnglish(data.expirationDate);
  const expirationDateArabic = formatDateArabic(data.expirationDate);
  const addonTypeArabic = translateAddonTypeToArabic(data.addonTypeName);
  const quantityText = data.quantity > 1 ? ` (${data.quantity})` : "";

  const content: BilingualContent = {
    english: {
      greeting: `Hello ${data.recipientName},`,
      mainContent: `Your ${data.addonTypeName}${quantityText} addon expired on ${expirationDateEnglish}.`,
      additionalInfo: `
        <div style="margin-top: 24px; padding: 20px; background-color: #F9F9F9; border-radius: 4px;">
          <p style="margin: 0 0 12px 0; font-weight: 600; color: #000000;">What Has Changed</p>
          <p style="margin: 0; color: #000000; font-size: 14px;">${data.whatHappened}</p>
        </div>
        <p style="margin-top: 20px; color: #000000; font-size: 14px;">To restore access to these features, please contact support or renew this addon at any time.</p>
      `,
    },
    arabic: {
      greeting: `مرحبًا ${data.recipientName}،`,
      mainContent: `انتهت صلاحية ${addonTypeArabic}${quantityText} في ${expirationDateArabic}.`,
      additionalInfo: `
        <div style="margin-top: 24px; padding: 20px; background-color: #F9F9F9; border-radius: 4px; direction: rtl; text-align: right;">
          <p style="margin: 0 0 12px 0; font-weight: 600; color: #000000;">ما الذي تغير</p>
          <p style="margin: 0; color: #000000; font-size: 14px;">${data.whatHappenedArabic}</p>
        </div>
        <p style="margin-top: 20px; color: #000000; font-size: 14px; direction: rtl; text-align: right;">لاستعادة الوصول إلى هذه الميزات، يرجى الاتصال بالدعم أو تجديد هذه الإضافة في أي وقت.</p>
      `,
    },
  };

  const metadata: EmailMetadata = {
    subject: "Addon Expired | انتهت صلاحية الإضافة",
    previewText: `Your ${data.addonTypeName} addon has expired`,
  };

  return generateBilingualEmail(content, metadata);
}

export function getAddonExpiredEmailText(data: AddonExpiredData): string {
  const expirationDateEnglish = formatDateEnglish(data.expirationDate);
  const expirationDateArabic = formatDateArabic(data.expirationDate);
  const addonTypeArabic = translateAddonTypeToArabic(data.addonTypeName);
  const quantityText = data.quantity > 1 ? ` (${data.quantity})` : "";

  return `
Hello ${data.recipientName},

Your ${data.addonTypeName}${quantityText} addon expired on ${expirationDateEnglish}.

What Has Changed:
${data.whatHappened}

To restore access to these features, please contact support or renew this addon at any time.

---

مرحبًا ${data.recipientName}،

انتهت صلاحية ${addonTypeArabic}${quantityText} في ${expirationDateArabic}.

ما الذي تغير:
${data.whatHappenedArabic}

لاستعادة الوصول إلى هذه الميزات، يرجى الاتصال بالدعم أو تجديد هذه الإضافة في أي وقت.

---

Best regards,
The Digitalsite Team

مع أطيب التحيات،
فريق Digitalsite
  `.trim();
}
