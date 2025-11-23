import {
  generateBilingualEmail,
  generateBilingualEmailText,
  BilingualContent,
  EmailMetadata,
} from "../templates/base-template";

export interface AdminInvitationEmailData {
  invitedEmail: string;
  invitationUrl: string;
  plan: string;
}

export function getAdminInvitationEmailHtml(
  data: AdminInvitationEmailData
): string {
  const content: BilingualContent = {
    english: {
      greeting: "Hello,",
      mainContent:
        "You have been invited to join Digitalsite. An administrator has created an account for you with premium access. Click the button below to complete your registration and set your password.",
      ctaText: "Create Your Account",
      ctaUrl: data.invitationUrl,
      additionalInfo:
        "This invitation will expire in 7 days. If you did not expect this invitation, you can ignore this email.",
    },
    arabic: {
      greeting: "مرحبًا،",
      mainContent:
        "تمت دعوتك للانضمام إلى Digitalsite. قام أحد المسؤولين بإنشاء حساب لك مع وصول مميز. انقر على الزر أدناه لإكمال تسجيلك وتعيين كلمة المرور الخاصة بك.",
      ctaText: "إنشاء حسابك",
      ctaUrl: data.invitationUrl,
      additionalInfo:
        "ستنتهي صلاحية هذه الدعوة خلال 7 أيام. إذا لم تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد الإلكتروني.",
    },
  };

  const metadata: EmailMetadata = {
    subject:
      "You're Invited to Join Digitalsite | تمت دعوتك للانضمام إلى Digitalsite",
    previewText: "Complete your registration to get started",
  };

  return generateBilingualEmail(content, metadata);
}

export function getAdminInvitationEmailText(
  data: AdminInvitationEmailData
): string {
  const content: BilingualContent = {
    english: {
      greeting: "Hello,",
      mainContent:
        "You have been invited to join Digitalsite. An administrator has created an account for you with premium access. Visit the link below to complete your registration and set your password.",
      ctaText: "Create Your Account",
      ctaUrl: data.invitationUrl,
      additionalInfo:
        "This invitation will expire in 7 days. If you did not expect this invitation, you can ignore this email.",
    },
    arabic: {
      greeting: "مرحبًا،",
      mainContent:
        "تمت دعوتك للانضمام إلى Digitalsite. قام أحد المسؤولين بإنشاء حساب لك مع وصول مميز. قم بزيارة الرابط أدناه لإكمال تسجيلك وتعيين كلمة المرور الخاصة بك.",
      ctaText: "إنشاء حسابك",
      ctaUrl: data.invitationUrl,
      additionalInfo:
        "ستنتهي صلاحية هذه الدعوة خلال 7 أيام. إذا لم تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد الإلكتروني.",
    },
  };

  return generateBilingualEmailText(content);
}
