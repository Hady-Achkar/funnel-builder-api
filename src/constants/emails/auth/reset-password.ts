import {
  generateBilingualEmail,
  generateBilingualEmailText,
  BilingualContent,
  EmailMetadata,
} from '../templates/base-template';

export interface ResetPasswordEmailData {
  resetUrl: string;
}

export function getResetPasswordEmailHtml(data: ResetPasswordEmailData): string {
  const content: BilingualContent = {
    english: {
      greeting: 'Reset Your Password',
      mainContent:
        'You requested to reset your password. Click the button below to create a new password for your account.',
      ctaText: 'Reset Password',
      ctaUrl: data.resetUrl,
      additionalInfo:
        'This password reset link will expire in 1 hour. If you did not request this password reset, please ignore this email and your password will remain unchanged.',
    },
    arabic: {
      greeting: 'إعادة تعيين كلمة المرور',
      mainContent:
        'لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة لحسابك.',
      ctaText: 'إعادة تعيين كلمة المرور',
      ctaUrl: data.resetUrl,
      additionalInfo:
        'ستنتهي صلاحية رابط إعادة تعيين كلمة المرور خلال ساعة واحدة. إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني وستبقى كلمة المرور الخاصة بك دون تغيير.',
    },
  };

  const metadata: EmailMetadata = {
    subject: 'Reset Your Password | إعادة تعيين كلمة المرور',
    previewText: 'Click to reset your password',
  };

  return generateBilingualEmail(content, metadata);
}

export function getResetPasswordEmailText(data: ResetPasswordEmailData): string {
  const content: BilingualContent = {
    english: {
      greeting: 'Reset Your Password',
      mainContent:
        'You requested to reset your password. Click the button below to create a new password for your account.',
      ctaText: 'Reset Password',
      ctaUrl: data.resetUrl,
      additionalInfo:
        'This password reset link will expire in 1 hour. If you did not request this password reset, please ignore this email and your password will remain unchanged.',
    },
    arabic: {
      greeting: 'إعادة تعيين كلمة المرور',
      mainContent:
        'لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة لحسابك.',
      ctaText: 'إعادة تعيين كلمة المرور',
      ctaUrl: data.resetUrl,
      additionalInfo:
        'ستنتهي صلاحية رابط إعادة تعيين كلمة المرور خلال ساعة واحدة. إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني وستبقى كلمة المرور الخاصة بك دون تغيير.',
    },
  };

  return generateBilingualEmailText(content);
}
