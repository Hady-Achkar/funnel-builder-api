/**
 * Payout Completed Email Template
 *
 * Sent when a payout request is successfully completed
 * Follows EMAIL_GUIDE.md: Professional, bilingual, black & white only
 */

export interface PayoutCompletedData {
  recipientName: string;
  amount: number;
  fees: number;
  netAmount: number;
  method: string;
  currency: string;
  // Bank details
  accountNumber?: string;
  bankName?: string;
  accountHolderName?: string;
  swiftCode?: string;
  // USDT details
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

function buildDataBlockHtml(data: PayoutCompletedData, isArabic: boolean = false): string {
  const methodFormatted = formatPayoutMethod(data.method);

  let html = `<div style="${STYLES.dataBlock}">`;

  if (isArabic) {
    html += `
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">المبلغ المعالج:</span> <span style="${STYLES.value}">${data.amount.toFixed(2)} ${data.currency}</span></div>
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">رسوم المعالجة:</span> <span style="${STYLES.value}">${data.fees.toFixed(2)} ${data.currency}</span></div>
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">صافي المبلغ المحول:</span> <span style="${STYLES.value}">${data.netAmount.toFixed(2)} ${data.currency}</span></div>
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">طريقة الدفع:</span> <span style="${STYLES.value}">${methodFormatted.ar}</span></div>
    `;

    if (data.method !== 'USDT') {
      if (data.accountHolderName) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">اسم صاحب الحساب:</span> <span style="${STYLES.value}">${data.accountHolderName}</span></div>`;
      if (data.bankName) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">البنك:</span> <span style="${STYLES.value}">${data.bankName}</span></div>`;
      if (data.accountNumber) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">رقم الحساب:</span> <span style="${STYLES.value}">${data.accountNumber}</span></div>`;
      if (data.swiftCode) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">رمز SWIFT:</span> <span style="${STYLES.value}">${data.swiftCode}</span></div>`;
    }

    if (data.method === 'USDT') {
      if (data.usdtWalletAddress) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">عنوان المحفظة:</span> <span style="${STYLES.value}">${data.usdtWalletAddress}</span></div>`;
      if (data.usdtNetwork) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">الشبكة:</span> <span style="${STYLES.value}">${data.usdtNetwork}</span></div>`;
    }
  } else {
    html += `
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">Amount Processed:</span> <span style="${STYLES.value}">${data.currency} ${data.amount.toFixed(2)}</span></div>
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">Processing Fees:</span> <span style="${STYLES.value}">${data.currency} ${data.fees.toFixed(2)}</span></div>
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">Net Amount Released:</span> <span style="${STYLES.value}">${data.currency} ${data.netAmount.toFixed(2)}</span></div>
      <div style="${STYLES.dataRow}"><span style="${STYLES.label}">Payment Method:</span> <span style="${STYLES.value}">${methodFormatted.en}</span></div>
    `;

    if (data.method !== 'USDT') {
      if (data.accountHolderName) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">Account Holder:</span> <span style="${STYLES.value}">${data.accountHolderName}</span></div>`;
      if (data.bankName) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">Bank:</span> <span style="${STYLES.value}">${data.bankName}</span></div>`;
      if (data.accountNumber) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">Account Number:</span> <span style="${STYLES.value}">${data.accountNumber}</span></div>`;
      if (data.swiftCode) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">SWIFT Code:</span> <span style="${STYLES.value}">${data.swiftCode}</span></div>`;
    }

    if (data.method === 'USDT') {
      if (data.usdtWalletAddress) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">Wallet Address:</span> <span style="${STYLES.value}">${data.usdtWalletAddress}</span></div>`;
      if (data.usdtNetwork) html += `<div style="${STYLES.dataRow}"><span style="${STYLES.label}">Network:</span> <span style="${STYLES.value}">${data.usdtNetwork}</span></div>`;
    }
  }

  html += '</div>';
  return html;
}

export function getPayoutCompletedEmailHtml(data: PayoutCompletedData): string {
  const englishDataBlock = buildDataBlockHtml(data, false);
  const arabicDataBlock = buildDataBlockHtml(data, true);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Withdrawal Completed Successfully</title>
</head>
<body style="${STYLES.container}">
  <!-- Header -->
  <div style="${STYLES.header}">
    <h1 style="${STYLES.logo}">Digitalsite</h1>
  </div>

  <!-- English Section -->
  <div style="${STYLES.section}">
    <p style="${STYLES.greeting}">Hello ${data.recipientName},</p>
    <p style="${STYLES.paragraph}">Your withdrawal request has been successfully processed.</p>
    <p style="${STYLES.paragraph}">The funds have been released to your registered payment method.</p>

    ${englishDataBlock}

    <p style="${STYLES.paragraph}">The payment should arrive in your account within the standard processing time for your payment method.</p>
    <p style="${STYLES.paragraph}">If you have any questions, please contact our support team.</p>
  </div>

  <hr style="${STYLES.divider}">

  <!-- Arabic Section -->
  <div style="${STYLES.sectionArabic}">
    <p style="${STYLES.greeting}">مرحبًا ${data.recipientName}،</p>
    <p style="${STYLES.paragraph}">تمت معالجة طلب السحب الخاص بك بنجاح.</p>
    <p style="${STYLES.paragraph}">تم تحويل الأموال إلى طريقة الدفع المسجلة لديك.</p>

    ${arabicDataBlock}

    <p style="${STYLES.paragraph}">يجب أن يصل الدفع إلى حسابك خلال الوقت القياسي لمعالجة طريقة الدفع الخاصة بك.</p>
    <p style="${STYLES.paragraph}">إذا كان لديك أي أسئلة، يرجى الاتصال بفريق الدعم لدينا.</p>
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

export function getPayoutCompletedEmailText(data: PayoutCompletedData): string {
  const methodFormatted = formatPayoutMethod(data.method);

  let englishDetails = `
Amount Processed: ${data.currency} ${data.amount.toFixed(2)}
Processing Fees: ${data.currency} ${data.fees.toFixed(2)}
Net Amount Released: ${data.currency} ${data.netAmount.toFixed(2)}
Payment Method: ${methodFormatted.en}`;

  let arabicDetails = `
المبلغ المعالج: ${data.amount.toFixed(2)} ${data.currency}
رسوم المعالجة: ${data.fees.toFixed(2)} ${data.currency}
صافي المبلغ المحول: ${data.netAmount.toFixed(2)} ${data.currency}
طريقة الدفع: ${methodFormatted.ar}`;

  if (data.method !== 'USDT') {
    if (data.accountHolderName) {
      englishDetails += `\nAccount Holder: ${data.accountHolderName}`;
      arabicDetails += `\nاسم صاحب الحساب: ${data.accountHolderName}`;
    }
    if (data.bankName) {
      englishDetails += `\nBank: ${data.bankName}`;
      arabicDetails += `\nالبنك: ${data.bankName}`;
    }
    if (data.accountNumber) {
      englishDetails += `\nAccount Number: ${data.accountNumber}`;
      arabicDetails += `\nرقم الحساب: ${data.accountNumber}`;
    }
    if (data.swiftCode) {
      englishDetails += `\nSWIFT Code: ${data.swiftCode}`;
      arabicDetails += `\nرمز SWIFT: ${data.swiftCode}`;
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

  return `
WITHDRAWAL COMPLETED SUCCESSFULLY
اكتمل السحب بنجاح

Hello ${data.recipientName},
Your withdrawal request has been successfully processed.
The funds have been released to your registered payment method.

${englishDetails}

The payment should arrive in your account within the standard processing time for your payment method.
If you have any questions, please contact our support team.

---

مرحبًا ${data.recipientName}،
تمت معالجة طلب السحب الخاص بك بنجاح.
تم تحويل الأموال إلى طريقة الدفع المسجلة لديك.

${arabicDetails}

يجب أن يصل الدفع إلى حسابك خلال الوقت القياسي لمعالجة طريقة الدفع الخاصة بك.
إذا كان لديك أي أسئلة، يرجى الاتصال بفريق الدعو لدينا.

---

Best regards,
The Digitalsite Team

مع أطيب التحيات،
فريق Digitalsite
  `.trim();
}
