import {
  generateBilingualEmail,
  BilingualContent,
  EmailMetadata,
} from '../templates/base-template';

export interface VerificationEmailData {
  firstName: string;
  verificationUrl: string;
}

export function getVerificationEmail(data: VerificationEmailData): string {
  const content: BilingualContent = {
    english: {
      greeting: `Hello ${data.firstName},`,
      mainContent:
        'Your account has been created successfully. Click the button below to verify your email address and activate your account.',
      ctaText: 'Verify Email Address',
      ctaUrl: data.verificationUrl,
      additionalInfo:
        'This verification link will expire in 24 hours. If you did not create this account, please ignore this email.',
    },
    arabic: {
      greeting: `مرحبًا ${data.firstName}،`,
      mainContent:
        'تم إنشاء حسابك بنجاح. انقر على الزر أدناه لتأكيد بريدك الإلكتروني وتفعيل حسابك.',
      ctaText: 'تأكيد البريد الإلكتروني',
      ctaUrl: data.verificationUrl,
      additionalInfo:
        'ستنتهي صلاحية رابط التأكيد خلال 24 ساعة. إذا لم تقم بإنشاء هذا الحساب، يرجى تجاهل هذا البريد الإلكتروني.',
    },
  };

  const metadata: EmailMetadata = {
    subject: 'Verify Your Email Address | تأكيد بريدك الإلكتروني',
    previewText: 'Verify your email address to activate your account',
  };

  return generateBilingualEmail(content, metadata);
}
