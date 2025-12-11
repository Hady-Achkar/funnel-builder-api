/**
 * Base Email Template System
 *
 * Professional, bilingual (English/Arabic) email templates
 * Design: High-ticket, black & white only, no emojis
 *
 * @see EMAIL_GUIDE.md for complete design specifications
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BilingualContent {
  english: {
    greeting: string;
    mainContent: string;
    ctaText?: string;
    ctaUrl?: string;
    additionalInfo?: string;
  };
  arabic: {
    greeting: string;
    mainContent: string;
    ctaText?: string;
    ctaUrl?: string;
    additionalInfo?: string;
  };
}

export interface EmailMetadata {
  subject: string;
  previewText: string;
}

export interface CredentialsData {
  label: string;
  value: string;
}

// ============================================================================
// STYLE CONSTANTS
// ============================================================================

const STYLES = {
  // Container styles
  body: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    line-height: 1.6;
    color: #000000;
    max-width: 600px;
    margin: 0 auto;
    padding: 0;
    background-color: #FFFFFF;
  `,
  container: `
    background-color: #FFFFFF;
    padding: 40px 30px;
    max-width: 600px;
    margin: 0 auto;
  `,

  // Header styles
  header: `
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 1px solid #E5E5E5;
  `,
  logo: `
    color: #000000;
    font-size: 32px;
    font-weight: 300;
    margin: 0;
    letter-spacing: -0.5px;
  `,

  // Section styles
  section: `
    margin-bottom: 40px;
  `,
  sectionArabic: `
    margin-bottom: 40px;
    direction: rtl;
    text-align: right;
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
  `,
  divider: `
    border: none;
    border-top: 1px solid #E5E5E5;
    margin: 40px 0;
  `,

  // Typography styles
  heading: `
    color: #000000;
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 20px 0;
    line-height: 1.3;
  `,
  paragraph: `
    color: #000000;
    font-size: 16px;
    line-height: 1.6;
    margin: 0 0 16px 0;
  `,
  paragraphArabic: `
    color: #000000;
    font-size: 16px;
    line-height: 1.8;
    margin: 0 0 16px 0;
  `,

  // Button styles
  buttonContainer: `
    text-align: center;
    margin: 30px 0;
  `,
  button: `
    display: inline-block;
    background-color: #000000;
    color: #FFFFFF;
    text-decoration: none;
    padding: 14px 32px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 16px;
    text-align: center;
    border: none;
  `,

  // Info box styles
  infoBox: `
    background-color: #F9F9F9;
    border: 1px solid #E5E5E5;
    border-radius: 4px;
    padding: 20px;
    margin: 20px 0;
  `,

  // Credentials styles
  credentialItem: `
    margin: 12px 0;
    font-size: 16px;
  `,
  credentialLabel: `
    font-weight: 600;
    color: #000000;
    display: inline-block;
    min-width: 100px;
  `,
  credentialValue: `
    font-family: 'Courier New', Courier, monospace;
    background-color: #FFFFFF;
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid #E5E5E5;
    color: #000000;
    display: inline-block;
  `,

  // Footer styles
  footer: `
    margin-top: 50px;
    padding-top: 30px;
    border-top: 1px solid #E5E5E5;
    font-size: 14px;
    color: #000000;
  `,
  footerText: `
    font-size: 14px;
    color: #000000;
    line-height: 1.6;
    margin: 0 0 10px 0;
  `,
  footerSmall: `
    font-size: 12px;
    color: #666666;
    line-height: 1.5;
    margin: 20px 0 0 0;
  `,
};

// ============================================================================
// COMPONENT BUILDERS
// ============================================================================

/**
 * Generates a black button with white text
 */
export function createButton(text: string, url: string): string {
  return `
    <div style="${STYLES.buttonContainer}">
      <a href="${url}" style="${STYLES.button}">
        ${text}
      </a>
    </div>
  `;
}

/**
 * Creates a credentials display box (e.g., email/password)
 */
export function createCredentialsBox(credentials: CredentialsData[]): string {
  const items = credentials
    .map(
      (cred) => `
    <div style="${STYLES.credentialItem}">
      <span style="${STYLES.credentialLabel}">${cred.label}:</span>
      <span style="${STYLES.credentialValue}">${cred.value}</span>
    </div>
  `
    )
    .join('');

  return `
    <div style="${STYLES.infoBox}">
      ${items}
    </div>
  `;
}

/**
 * Creates an info box for important notes
 */
export function createInfoBox(content: string): string {
  return `
    <div style="${STYLES.infoBox}">
      <p style="${STYLES.paragraph}">${content}</p>
    </div>
  `;
}

// ============================================================================
// MAIN TEMPLATE GENERATOR
// ============================================================================

/**
 * Generates a complete bilingual email HTML
 *
 * @param content - Bilingual content for English and Arabic sections
 * @param metadata - Email subject and preview text
 * @returns Complete HTML email string
 *
 * @example
 * ```typescript
 * const html = generateBilingualEmail({
 *   english: {
 *     greeting: "Welcome to Digitalsite",
 *     mainContent: "Your account has been created successfully.",
 *     ctaText: "Verify Email",
 *     ctaUrl: "https://example.com/verify?token=abc"
 *   },
 *   arabic: {
 *     greeting: "مرحبًا بك في Digitalsite",
 *     mainContent: "تم إنشاء حسابك بنجاح.",
 *     ctaText: "تأكيد البريد الإلكتروني",
 *     ctaUrl: "https://example.com/verify?token=abc"
 *   }
 * }, {
 *   subject: "Verify Your Email",
 *   previewText: "Click to verify your account"
 * });
 * ```
 */
export function generateBilingualEmail(
  content: BilingualContent,
  metadata: EmailMetadata
): string {
  const { english, arabic } = content;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>${metadata.subject}</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
    <style>
        @media only screen and (max-width: 600px) {
            .container {
                padding: 20px 15px !important;
            }
            .heading {
                font-size: 20px !important;
            }
            .button {
                padding: 12px 24px !important;
                font-size: 14px !important;
            }
        }
    </style>
</head>
<body style="${STYLES.body}">
    <div style="${STYLES.container}" class="container">

        <!-- Header -->
        <div style="${STYLES.header}">
            <h1 style="${STYLES.logo}">Digitalsite</h1>
        </div>

        <!-- English Section -->
        <div style="${STYLES.section}">
            <h2 style="${STYLES.heading}">${english.greeting}</h2>
            <p style="${STYLES.paragraph}">${english.mainContent}</p>
            ${english.ctaText && english.ctaUrl ? createButton(english.ctaText, english.ctaUrl) : ''}
            ${english.additionalInfo ? `<p style="${STYLES.paragraph}">${english.additionalInfo}</p>` : ''}
        </div>

        <!-- Divider -->
        <hr style="${STYLES.divider}">

        <!-- Arabic Section -->
        <div style="${STYLES.sectionArabic}">
            <h2 style="${STYLES.heading}">${arabic.greeting}</h2>
            <p style="${STYLES.paragraphArabic}">${arabic.mainContent}</p>
            ${arabic.ctaText && arabic.ctaUrl ? createButton(arabic.ctaText, arabic.ctaUrl) : ''}
            ${arabic.additionalInfo ? `<p style="${STYLES.paragraphArabic}">${arabic.additionalInfo}</p>` : ''}
        </div>

        <!-- Footer -->
        <div style="${STYLES.footer}">
            <p style="${STYLES.footerText}">
                <strong>Best regards,</strong><br>
                The Digitalsite Team
            </p>
            <p style="${STYLES.footerText}" dir="rtl">
                <strong>مع أطيب التحيات،</strong><br>
                فريق Digitalsite
            </p>
            <hr style="${STYLES.divider}">
            <p style="${STYLES.footerSmall}">
                If you have any questions, please contact our support team.<br>
                إذا كان لديك أي أسئلة، يرجى الاتصال بفريق الدعم لدينا.
            </p>
        </div>

    </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// TEXT VERSION GENERATOR (for email clients that don't support HTML)
// ============================================================================

/**
 * Generates plain text version of bilingual email
 *
 * @param content - Bilingual content
 * @returns Plain text email string
 */
export function generateBilingualEmailText(content: BilingualContent): string {
  const { english, arabic } = content;

  return `
DIGITALSITE

${english.greeting}

${english.mainContent}

${english.ctaText && english.ctaUrl ? `${english.ctaText}: ${english.ctaUrl}` : ''}

${english.additionalInfo || ''}

---

${arabic.greeting}

${arabic.mainContent}

${arabic.ctaText && arabic.ctaUrl ? `${arabic.ctaText}: ${arabic.ctaUrl}` : ''}

${arabic.additionalInfo || ''}

---

Best regards,
The Digitalsite Team

مع أطيب التحيات،
فريق Digitalsite

If you have any questions, please contact our support team.
إذا كان لديك أي أسئلة، يرجى الاتصال بفريق الدعم لدينا.
  `.trim();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Validates that email content doesn't contain emojis
 */
export function containsEmojis(text: string): boolean {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  return emojiRegex.test(text);
}

/**
 * Validates email content against design guidelines
 */
export function validateEmailContent(content: BilingualContent): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for emojis
  const allText = [
    content.english.greeting,
    content.english.mainContent,
    content.english.ctaText || '',
    content.english.additionalInfo || '',
    content.arabic.greeting,
    content.arabic.mainContent,
    content.arabic.ctaText || '',
    content.arabic.additionalInfo || '',
  ].join(' ');

  if (containsEmojis(allText)) {
    errors.push('Content contains emojis (not allowed per design guidelines)');
  }

  // Check for missing required fields
  if (!content.english.greeting) {
    errors.push('English greeting is required');
  }
  if (!content.english.mainContent) {
    errors.push('English main content is required');
  }
  if (!content.arabic.greeting) {
    errors.push('Arabic greeting is required');
  }
  if (!content.arabic.mainContent) {
    errors.push('Arabic main content is required');
  }

  // Check for CTA consistency
  if (Boolean(content.english.ctaText) !== Boolean(content.arabic.ctaText)) {
    errors.push('Both English and Arabic must have CTAs, or neither should');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  generateBilingualEmail,
  generateBilingualEmailText,
  createButton,
  createCredentialsBox,
  createInfoBox,
  validateEmailContent,
  escapeHtml,
  STYLES,
};
