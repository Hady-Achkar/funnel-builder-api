/**
 * Workspace Register Invitation Email
 *
 * Sent to new users (who don't have an account) when invited to join a workspace
 * Follows EMAIL_GUIDE.md standards: bilingual, black & white, professional
 */

import {
  generateBilingualEmail,
  generateBilingualEmailText,
  BilingualContent,
} from '../templates/base-template';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WorkspaceRegisterInvitationData {
  recipientEmail: string;
  workspaceName: string;
  role: string;
  registerUrl: string;
}

// ============================================================================
// EMAIL SUBJECT
// ============================================================================

export const WORKSPACE_REGISTER_INVITATION_SUBJECT = 'Workspace Invitation - Register Your Account | دعوة إلى مساحة العمل - تسجيل حسابك';

// ============================================================================
// HTML EMAIL GENERATOR
// ============================================================================

/**
 * Generates HTML email for workspace invitation (new users who need to register)
 */
export function getWorkspaceRegisterInvitationEmailHtml(
  data: WorkspaceRegisterInvitationData
): string {
  const content: BilingualContent = {
    english: {
      greeting: 'Hello,',
      mainContent: `You have been invited to join the workspace "${data.workspaceName}" as a ${data.role}. To accept this invitation, you need to create an account first. Click the button below to register and join the workspace.`,
      ctaText: 'Register & Join Workspace',
      ctaUrl: data.registerUrl,
      additionalInfo: 'This invitation will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.',
    },
    arabic: {
      greeting: 'مرحبًا،',
      mainContent: `تمت دعوتك للانضمام إلى مساحة العمل "${data.workspaceName}" بصفة ${data.role}. لقبول هذه الدعوة، تحتاج إلى إنشاء حساب أولاً. انقر على الزر أدناه للتسجيل والانضمام إلى مساحة العمل.`,
      ctaText: 'التسجيل والانضمام إلى مساحة العمل',
      ctaUrl: data.registerUrl,
      additionalInfo: 'ستنتهي صلاحية هذه الدعوة خلال 7 أيام. إذا لم تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد الإلكتروني بأمان.',
    },
  };

  return generateBilingualEmail(content, {
    subject: WORKSPACE_REGISTER_INVITATION_SUBJECT,
    previewText: 'Create your account and join a workspace',
  });
}

// ============================================================================
// TEXT EMAIL GENERATOR
// ============================================================================

/**
 * Generates plain text email for workspace invitation (new users who need to register)
 */
export function getWorkspaceRegisterInvitationEmailText(
  data: WorkspaceRegisterInvitationData
): string {
  const content: BilingualContent = {
    english: {
      greeting: 'Hello,',
      mainContent: `You have been invited to join the workspace "${data.workspaceName}" as a ${data.role}. To accept this invitation, you need to create an account first. Click the link below to register and join the workspace.`,
      ctaText: 'Register & Join Workspace',
      ctaUrl: data.registerUrl,
      additionalInfo: 'This invitation will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.',
    },
    arabic: {
      greeting: 'مرحبًا،',
      mainContent: `تمت دعوتك للانضمام إلى مساحة العمل "${data.workspaceName}" بصفة ${data.role}. لقبول هذه الدعوة، تحتاج إلى إنشاء حساب أولاً. انقر على الرابط أدناه للتسجيل والانضمام إلى مساحة العمل.`,
      ctaText: 'التسجيل والانضمام إلى مساحة العمل',
      ctaUrl: data.registerUrl,
      additionalInfo: 'ستنتهي صلاحية هذه الدعوة خلال 7 أيام. إذا لم تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد الإلكتروني بأمان.',
    },
  };

  return generateBilingualEmailText(content);
}
