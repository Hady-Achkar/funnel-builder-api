/**
 * Payout Failed Email Template
 *
 * Sent when a payout request fails
 * Follows EMAIL_GUIDE.md: Professional, bilingual, black & white only
 */

export interface PayoutFailedData {
  recipientName: string;
  amount: number;
  fees: number;
  netAmount: number;
  method: string;
  currency: string;
  // Optional fields - only included if present
  failureReason?: string;
  transactionId?: string;
  transactionProof?: string;
  documentUrl?: string;
  // Bank details for context
  accountNumber?: string;
  bankName?: string;
  // USDT details for context
  usdtWalletAddress?: string;
  usdtNetwork?: string;
}

// Styles for structured data block
const STYLES = {
  container: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background-color: #FFFFFF;
  `,
  header: `
    text-align: center;
    padding: 40px 30px 20px;
    border-bottom: 1px solid #E5E5E5;
  `,
  logo: `
    color: #000000;
    font-size: 28px;
    font-weight: 600;
    margin: 0;
  `,
  section: `
    padding: 30px;
  `,
  sectionArabic: `
    padding: 30px;
    direction: rtl;
    text-align: right;
  `,
  greeting: `
    color: #000000;
    font-size: 18px;
    margin-bottom: 20px;
  `,
  paragraph: `
    color: #000000;
    font-size: 16px;
    line-height: 1.6;
    margin: 15px 0;
  `,
  dataBlock: `
    background-color: #F9F9F9;
    border: 1px solid #E5E5E5;
    border-radius: 4px;
    padding: 20px;
    margin: 25px 0;
  `,
  dataRow: `
    margin: 10px 0;
    font-size: 15px;
    line-height: 1.6;
  `,
  label: `
    font-weight: 600;
    color: #000000;
    display: inline-block;
    min-width: 150px;
  `,
  value: `
    color: #000000;
  `,
  divider: `
    border: none;
    border-top: 1px solid #E5E5E5;
    margin: 40px 0;
  `,
  footer: `
    padding: 30px;
    border-top: 1px solid #E5E5E5;
    font-size: 14px;
    color: #666666;
    text-align: center;
  `,
};

function formatPayoutMethod(method: string): { en: string; ar: string } {
  const methods: Record<string, { en: string; ar: string }> = {
    UAE_BANK: { en: 'UAE Bank Transfer', ar: 'تحويل بنكي إماراتي' },
    INTERNATIONAL_BANK: { en: 'International Bank Transfer', ar: 'تحويل بنكي دولي' },
    USDT: { en: 'USDT Cryptocurrency', ar: 'عملة USDT الرقمية' },
  };
  return methods[method] || { en: method, ar: method };
}

function buildDataBlockHtml(data: PayoutFailedData, isArabic: boolean = false): string {
  const methodFormatted = formatPayoutMethod(data.method);

  let html = `<div style="${STYLES.dataBlock}">`;

  if (isArabic) {
    html += `
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">المبلغ المطلوب:</span> <span style="${STYLES.value}">${data.amount.toFixed(2)} ${data.currency}</span></div>
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">رسوم المعالجة:</span> <span style="${STYLES.value}">${data.fees.toFixed(2)} ${data.currency}</span></div>
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">صافي المبلغ:</span> <span style="${STYLES.value}">${data.netAmount.toFixed(2)} ${data.currency}</span></div>
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">طريقة الدفع:</span> <span style="${STYLES.value}">${methodFormatted.ar}</span></div>
    `;

    if (data.method !== 'USDT') {
      if (data.accountNumber) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">رقم الحساب:</span> <span style="${STYLES.value}">${data.accountNumber}</span></div>`;
      if (data.bankName) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">البنك:</span> <span style="${STYLES.value}">${data.bankName}</span></div>`;
    }

    if (data.method === 'USDT') {
      if (data.usdtWalletAddress) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">عنوان المحفظة:</span> <span style="${STYLES.value}">${data.usdtWalletAddress}</span></div>`;
      if (data.usdtNetwork) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">الشبكة:</span> <span style="${STYLES.value}">${data.usdtNetwork}</span></div>`;
    }

    // Failure details
    if (data.failureReason) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">السبب:</span> <span style="${STYLES.value}">${data.failureReason}</span></div>`;
    if (data.transactionId) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">رقم المعاملة:</span> <span style="${STYLES.value}">${data.transactionId}</span></div>`;
    if (data.transactionProof) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">إثبات المعاملة:</span> <span style="${STYLES.value}">${data.transactionProof}</span></div>`;
    if (data.documentUrl) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">المستند الداعم:</span> <span style="${STYLES.value}">${data.documentUrl}</span></div>`;
  } else {
    html += `
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">Amount Requested:</span> <span style="${STYLES.value}">${data.currency} ${data.amount.toFixed(2)}</span></div>
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">Processing Fees:</span> <span style="${STYLES.value}">${data.currency} ${data.fees.toFixed(2)}</span></div>
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">Net Amount:</span> <span style="${STYLES.value}">${data.currency} ${data.netAmount.toFixed(2)}</span></div>
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">Payment Method:</span> <span style="${STYLES.value}">${methodFormatted.en}</span></div>
    `;

    if (data.method !== 'USDT') {
      if (data.accountNumber) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">Account Number:</span> <span style="${STYLES.value}">${data.accountNumber}</span></div>`;
      if (data.bankName) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">Bank:</span> <span style="${STYLES.value}">${data.bankName}</span></div>`;
    }

    if (data.method === 'USDT') {
      if (data.usdtWalletAddress) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">Wallet Address:</span> <span style="${STYLES.value}">${data.usdtWalletAddress}</span></div>`;
      if (data.usdtNetwork) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">Network:</span> <span style="${STYLES.value}">${data.usdtNetwork}</span></div>`;
    }

    // Failure details
    if (data.failureReason) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">Reason:</span> <span style="${STYLES.value}">${data.failureReason}</span></div>`;
    if (data.transactionId) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">Transaction ID:</span> <span style="${STYLES.value}">${data.transactionId}</span></div>`;
    if (data.transactionProof) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">Transaction Proof:</span> <span style="${STYLES.value}">${data.transactionProof}</span></div>`;
    if (data.documentUrl) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">Supporting Document:</span> <span style="${STYLES.value}">${data.documentUrl}</span></div>`;
  }

  html += '</div>';
  return html;
}

export function getPayoutFailedEmailHtml(data: PayoutFailedData): string {
  const englishDataBlock = buildDataBlockHtml(data, false);
  const arabicDataBlock = buildDataBlockHtml(data, true);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Withdrawal Request Failed</title>
</head>
<body style="${STYLES.container}">
  <!-- Header -->
  <div style="${STYLES.header}">
    <h1 style="${STYLES.logo}">Digitalsite</h1>
  </div>

  <!-- English Section -->
  <div style="${STYLES.section}">
    <p style="${STYLES.greeting}">Hello ${data.recipientName},</p>
    <p style="${STYLES.paragraph}">Your withdrawal request has failed.</p>
    <p style="${STYLES.paragraph}">The requested amount will remain in your account balance.</p>

    ${englishDataBlock}

    <p style="${STYLES.paragraph}">If you have questions, please contact our support team.</p>
  </div>

  <hr style="${STYLES.divider}">

  <!-- Arabic Section -->
  <div style="${STYLES.sectionArabic}">
    <p style="${STYLES.greeting}">مرحبًا ${data.recipientName},</p>
    <p style="${STYLES.paragraph}">فشل طلب السحب الخاص بك.</p>
    <p style="${STYLES.paragraph}">سيبقى المبلغ المطلوب في رصيد حسابك.</p>

    ${arabicDataBlock}

    <p style="${STYLES.paragraph}">إذا كان لديك أسئلة، يرجى الاتصال بفريق الدعم لدينا.</p>
  </div>

  <!-- Footer -->
  <div style="${STYLES.footer}">
    <p>Best regards, The Digitalsite Team</p>
    <p>مع أطيب التحيات، فريق Digitalsite</p>
  </div>
</body>
</html>
  `.trim();
}

export function getPayoutFailedEmailText(data: PayoutFailedData): string {
  const methodFormatted = formatPayoutMethod(data.method);

  let englishDetails = `
Amount Requested: ${data.currency} ${data.amount.toFixed(2)}
Processing Fees: ${data.currency} ${data.fees.toFixed(2)}
Net Amount: ${data.currency} ${data.netAmount.toFixed(2)}
Payment Method: ${methodFormatted.en}`;

  let arabicDetails = `
المبلغ المطلوب: ${data.amount.toFixed(2)} ${data.currency}
رسوم المعالجة: ${data.fees.toFixed(2)} ${data.currency}
صافي المبلغ: ${data.netAmount.toFixed(2)} ${data.currency}
طريقة الدفع: ${methodFormatted.ar}`;

  if (data.method !== 'USDT') {
    if (data.accountNumber) {
      englishDetails += `\nAccount Number: ${data.accountNumber}`;
      arabicDetails += `\nرقم الحساب: ${data.accountNumber}`;
    }
    if (data.bankName) {
      englishDetails += `\nBank: ${data.bankName}`;
      arabicDetails += `\nالبنك: ${data.bankName}`;
    }
  }

  if (data.method === 'USDT') {
    if (data.usdtWalletAddress) {
      englishDetails += `\nWallet Address: ${data.usdtWalletAddress}`;
      arabicDetails += `\nعنوان المحفظة: ${data.usdtWalletAddress}`;
    }
    if (data.usdtNetwork) {
      englishDetails += `\nNetwork: ${data.usdtNetwork}`;
      arabicDetails += `\nالشبكة: ${data.usdtNetwork}`;
    }
  }

  // Add failure details
  if (data.failureReason) {
    englishDetails += `\nReason: ${data.failureReason}`;
    arabicDetails += `\nالسبب: ${data.failureReason}`;
  }
  if (data.transactionId) {
    englishDetails += `\nTransaction ID: ${data.transactionId}`;
    arabicDetails += `\nرقم المعاملة: ${data.transactionId}`;
  }
  if (data.transactionProof) {
    englishDetails += `\nTransaction Proof: ${data.transactionProof}`;
    arabicDetails += `\nإثبات المعاملة: ${data.transactionProof}`;
  }
  if (data.documentUrl) {
    englishDetails += `\nSupporting Document: ${data.documentUrl}`;
    arabicDetails += `\nالمستند الداعم: ${data.documentUrl}`;
  }

  return `
WITHDRAWAL REQUEST FAILED
فشل طلب السحب

Hello ${data.recipientName},
Your withdrawal request has failed.
The requested amount will remain in your account balance.

${englishDetails}

If you have questions, please contact our support team.

---

مرحبًا ${data.recipientName}،
فشل طلب السحب الخاص بك.
سيبقى المبلغ المطلوب في رصيد حسابك.

${arabicDetails}

إذا كان لديك أسئلة، يرجى الاتصال بفريق الدعم لدينا.

---

Best regards,
The Digitalsite Team

مع أطيب التحيات،
فريق Digitalsite
  `.trim();
}
