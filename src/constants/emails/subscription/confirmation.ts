import {
  generateBilingualEmail,
  BilingualContent,
  EmailMetadata,
} from "../templates/base-template";

export interface SubscriptionConfirmationData {
  userEmail: string;
  planType: "BUSINESS" | "AGENCY";
  subscriptionId: string;
}

export function getSubscriptionConfirmationEmailHtml(
  data: SubscriptionConfirmationData
): string {
  const planName = data.planType === "BUSINESS" ? "Business" : "Partner Plan";
  const planNameArabic =
    data.planType === "BUSINESS" ? "الأعمال" : "الشريك";

  const content: BilingualContent = {
    english: {
      greeting: "Hello,",
      mainContent: `You have successfully subscribed to the Digitalsite ${planName} Plan. Your subscription ID is ${data.subscriptionId}.`,
      additionalInfo:
        "Your account is now active. You can start using all the features included in your plan.",
    },
    arabic: {
      greeting: "مرحبًا،",
      mainContent: `لقد قمت بالاشتراك بنجاح في خطة ${planNameArabic} من Digitalsite. رقم الاشتراك الخاص بك هو ${data.subscriptionId}.`,
      additionalInfo:
        "حسابك الآن نشط. يمكنك البدء في استخدام جميع الميزات المتضمنة في خطتك.",
    },
  };

  const metadata: EmailMetadata = {
    subject: `Subscription Confirmed - ${planName} Plan | تأكيد الاشتراك - خطة ${planNameArabic}`,
    previewText: `Your ${planName} Plan subscription is now active`,
  };

  return generateBilingualEmail(content, metadata);
}

export function getSubscriptionConfirmationEmailText(
  data: SubscriptionConfirmationData
): string {
  const planName = data.planType === "BUSINESS" ? "Business" : "Partner Plan";
  const planNameArabic =
    data.planType === "BUSINESS" ? "الأعمال" : "الشريك";

  return `
DIGITALSITE

Hello,

You have successfully subscribed to the Digitalsite ${planName} Plan. Your subscription ID is ${data.subscriptionId}.

Your account is now active. You can start using all the features included in your plan.

---

مرحبًا،

لقد قمت بالاشتراك بنجاح في خطة ${planNameArabic} من Digitalsite. رقم الاشتراك الخاص بك هو ${data.subscriptionId}.

حسابك الآن نشط. يمكنك البدء في استخدام جميع الميزات المتضمنة في خطتك.

---

Best regards,
The Digitalsite Team

مع أطيب التحيات،
فريق Digitalsite

If you have any questions, please contact our support team.
إذا كان لديك أي أسئلة، يرجى الاتصال بفريق الدعم لدينا.
  `.trim();
}
