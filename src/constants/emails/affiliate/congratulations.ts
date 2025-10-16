import { BilingualContent, EmailMetadata, generateBilingualEmail } from "../templates/base-template";

export function getAffiliateCongratulationsEmailHtml(): string {
  const content: BilingualContent = {
    english: {
      greeting: "Hello,",
      mainContent:
        "Someone has subscribed to Digitalsite using your affiliate link. Thank you for being a valuable partner.",
      additionalInfo:
        "Your commission will be processed according to the standard affiliate terms.",
    },
    arabic: {
      greeting: "مرحبًا،",
      mainContent:
        "لقد قام شخص ما بالاشتراك في Digitalsite باستخدام رابط الإحالة الخاص بك. شكرًا لك على كونك شريكًا قيمًا.",
      additionalInfo:
        "سيتم معالجة عمولتك وفقًا لشروط الشراكة القياسية.",
    },
  };

  const metadata: EmailMetadata = {
    subject: "New Affiliate Subscription | اشتراك جديد عبر الإحالة",
    previewText: "Someone subscribed using your affiliate link",
  };

  return generateBilingualEmail(content, metadata);
}

export function getAffiliateCongratulationsEmailText(): string {
  return `
DIGITALSITE

Hello,

Someone has subscribed to Digitalsite using your affiliate link. Thank you for being a valuable partner.

Your commission will be processed according to the standard affiliate terms.

---

مرحبًا،

لقد قام شخص ما بالاشتراك في Digitalsite باستخدام رابط الإحالة الخاص بك. شكرًا لك على كونك شريكًا قيمًا.

سيتم معالجة عمولتك وفقًا لشروط الشراكة القياسية.

---

Best regards,
The Digitalsite Team

مع أطيب التحيات،
فريق Digitalsite

If you have any questions, please contact our support team.
إذا كان لديك أي أسئلة، يرجى الاتصال بفريق الدعم لدينا.
  `.trim();
}