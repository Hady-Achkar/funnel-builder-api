/**
 * Workspace Invitation Email
 *
 * Sent to existing users when they are invited to join a workspace
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

export interface WorkspaceInvitationData {
  recipientEmail: string;
  workspaceName: string;
  role: string;
  invitationUrl: string;
}

// ============================================================================
// EMAIL SUBJECT
// ============================================================================

export const WORKSPACE_INVITATION_SUBJECT = 'Workspace Invitation | دعوة إلى مساحة العمل';

// ============================================================================
// HTML EMAIL GENERATOR
// ============================================================================

/**
 * Generates HTML email for workspace invitation (existing users)
 */
export function getWorkspaceInvitationEmailHtml(
  data: WorkspaceInvitationData
): string {
  const content: BilingualContent = {
    english: {
      greeting: 'Hello,',
      mainContent: `You have been invited to join the workspace "${data.workspaceName}" as a ${data.role}. Click the button below to accept this invitation.`,
      ctaText: 'Accept Invitation',
      ctaUrl: data.invitationUrl,
      additionalInfo: 'This invitation will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.',
    },
    arabic: {
      greeting: 'مرحبًا،',
      mainContent: `تمت دعوتك للانضمام إلى مساحة العمل "${data.workspaceName}" بصفة ${data.role}. انقر على الزر أدناه لقبول هذه الدعوة.`,
      ctaText: 'قبول الدعوة',
      ctaUrl: data.invitationUrl,
      additionalInfo: 'ستنتهي صلاحية هذه الدعوة خلال 7 أيام. إذا لم تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد الإلكتروني بأمان.',
    },
  };

  return generateBilingualEmail(content, {
    subject: WORKSPACE_INVITATION_SUBJECT,
    previewText: 'You have been invited to join a workspace',
  });
}

// ============================================================================
// TEXT EMAIL GENERATOR
// ============================================================================

/**
 * Generates plain text email for workspace invitation (existing users)
 */
export function getWorkspaceInvitationEmailText(
  data: WorkspaceInvitationData
): string {
  const content: BilingualContent = {
    english: {
      greeting: 'Hello,',
      mainContent: `You have been invited to join the workspace "${data.workspaceName}" as a ${data.role}. Click the link below to accept this invitation.`,
      ctaText: 'Accept Invitation',
      ctaUrl: data.invitationUrl,
      additionalInfo: 'This invitation will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.',
    },
    arabic: {
      greeting: 'مرحبًا،',
      mainContent: `تمت دعوتك للانضمام إلى مساحة العمل "${data.workspaceName}" بصفة ${data.role}. انقر على الرابط أدناه لقبول هذه الدعوة.`,
      ctaText: 'قبول الدعوة',
      ctaUrl: data.invitationUrl,
      additionalInfo: 'ستنتهي صلاحية هذه الدعوة خلال 7 أيام. إذا لم تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد الإلكتروني بأمان.',
    },
  };

  return generateBilingualEmailText(content);
}
