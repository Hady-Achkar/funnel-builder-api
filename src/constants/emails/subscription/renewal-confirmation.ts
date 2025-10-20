/**
 * Email templates for subscription renewal confirmation
 * Following EMAIL_GUIDE.md: Bilingual (English + Arabic), Black & White only
 */

interface RenewalEmailData {
  userEmail: string;
  planType: "BUSINESS" | "AGENCY";
  subscriptionId: string;
  nextPaymentDate: string; // DD/MM/YYYY format
}

export function getSubscriptionRenewalEmailHtml(
  data: RenewalEmailData
): string {
  const planName = data.planType === "BUSINESS" ? "Business" : "Partner";
  const planNameArabic = data.planType === "BUSINESS" ? "الأعمال" : "الشريك";

  return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Renewed</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #ffffff;
      color: #000000;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
      border: 1px solid #000000;
    }
    h1 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #000000;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 15px;
      color: #000000;
    }
    .arabic {
      direction: rtl;
      text-align: right;
    }
    .details {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #000000;
      background-color: #f9f9f9;
    }
    .details p {
      margin: 5px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #000000;
      font-size: 14px;
      color: #666666;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- English Content -->
    <h1>Subscription Renewed Successfully</h1>
    <p>Dear Valued Customer,</p>
    <p>
      Your <strong>${planName} Plan</strong> subscription has been successfully renewed.
      Thank you for your continued trust in Digitalsite.
    </p>

    <div class="details">
      <p><strong>Subscription ID:</strong> ${data.subscriptionId}</p>
      <p><strong>Plan:</strong> ${planName} Plan</p>
      <p><strong>Next Billing Date:</strong> ${data.nextPaymentDate}</p>
    </div>

    <p>
      Your subscription will continue uninterrupted. You can manage your subscription
      and billing details in your account dashboard.
    </p>

    <p>
      If you have any questions or need assistance, please don't hesitate to contact
      our support team.
    </p>

    <!-- Arabic Content -->
    <div class="arabic" style="margin-top: 40px;">
      <h1>تم تجديد الاشتراك بنجاح</h1>
      <p>عزيزي العميل،</p>
      <p>
        تم تجديد اشتراكك في <strong>خطة ${planNameArabic}</strong> بنجاح.
        نشكرك على ثقتك المستمرة في Digitalsite.
      </p>

      <div class="details">
        <p><strong>رقم الاشتراك:</strong> ${data.subscriptionId}</p>
        <p><strong>الخطة:</strong> خطة ${planNameArabic}</p>
        <p><strong>تاريخ الفوترة التالي:</strong> ${data.nextPaymentDate}</p>
      </div>

      <p>
        سيستمر اشتراكك دون انقطاع. يمكنك إدارة اشتراكك وتفاصيل الفوترة
        من لوحة التحكم الخاصة بحسابك.
      </p>

      <p>
        إذا كان لديك أي أسئلة أو تحتاج إلى مساعدة، فلا تتردد في الاتصال
        بفريق الدعم لدينا.
      </p>
    </div>

    <div class="footer">
      <p>Best regards,<br>The Digitalsite Team</p>
      <p class="arabic">مع أطيب التحيات،<br>فريق Digitalsite</p>
    </div>
  </div>
</body>
</html>
`;
}

export function getSubscriptionRenewalEmailText(
  data: RenewalEmailData
): string {
  const planName = data.planType === "BUSINESS" ? "Business" : "Partner";
  const planNameArabic = data.planType === "BUSINESS" ? "الأعمال" : "الشريك";

  return `
Subscription Renewed Successfully
تم تجديد الاشتراك بنجاح

Dear Valued Customer,
عزيزي العميل،

Your ${planName} Plan subscription has been successfully renewed.
Thank you for your continued trust in Digitalsite.

تم تجديد اشتراكك في خطة ${planNameArabic} بنجاح.
نشكرك على ثقتك المستمرة في Digitalsite.

Subscription Details / تفاصيل الاشتراك:
- Subscription ID / رقم الاشتراك: ${data.subscriptionId}
- Plan / الخطة: ${planName} Plan / خطة ${planNameArabic}
- Next Billing Date / تاريخ الفوترة التالي: ${data.nextPaymentDate}

Your subscription will continue uninterrupted. You can manage your subscription
and billing details in your account dashboard.

سيستمر اشتراكك دون انقطاع. يمكنك إدارة اشتراكك وتفاصيل الفوترة
من لوحة التحكم الخاصة بحسابك.

If you have any questions or need assistance, please don't hesitate to contact
our support team.

إذا كان لديك أي أسئلة أو تحتاج إلى مساعدة، فلا تتردد في الاتصال
بفريق الدعم لدينا.

Best regards,
The Digitalsite Team

مع أطيب التحيات،
فريق Digitalsite
`;
}
