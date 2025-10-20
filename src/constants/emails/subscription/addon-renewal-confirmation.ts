import { AddOnType } from "../../../generated/prisma-client";

interface AddonRenewalEmailData {
  userEmail: string;
  addonType: AddOnType;
  subscriptionId: string;
  nextPaymentDate: string; // DD/MM/YYYY format
}

export function getAddonRenewalEmailHtml(
  data: AddonRenewalEmailData
): string {
  const { addonType, subscriptionId, nextPaymentDate } = data;

  // Map addon type to display names
  let addonName: string;
  let addonNameArabic: string;

  switch (addonType) {
    case AddOnType.EXTRA_CUSTOM_DOMAIN:
      addonName = "Domain";
      addonNameArabic = "النطاق";
      break;
    case AddOnType.EXTRA_WORKSPACE:
      addonName = "Workspace";
      addonNameArabic = "مساحة العمل";
      break;
    case AddOnType.EXTRA_SUBDOMAIN:
      addonName = "Subdomain";
      addonNameArabic = "النطاق الفرعي";
      break;
    case AddOnType.EXTRA_ADMIN:
      addonName = "Admin";
      addonNameArabic = "مدير";
      break;
    case AddOnType.EXTRA_FUNNEL:
      addonName = "Website"; // Use "Website" instead of "Funnel" - more user-friendly
      addonNameArabic = "الموقع"; // Use "الموقع" (website) instead of "مسار" (funnel)
      break;
    case AddOnType.EXTRA_PAGE:
      addonName = "Page";
      addonNameArabic = "صفحة";
      break;
    default:
      addonName = "Addon";
      addonNameArabic = "إضافة";
  }

  return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Addon Renewed - ${addonName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="border: 2px solid #000000; background-color: #ffffff;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px; text-align: center; border-bottom: 2px solid #000000;">
                            <h1 style="margin: 0; font-size: 28px; color: #000000;">Digitalsite</h1>
                        </td>
                    </tr>

                    <!-- English Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #000000;">Addon Renewed Successfully</h2>
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                Your <strong>${addonName}</strong> addon has been successfully renewed.
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                <strong>Subscription ID:</strong> ${subscriptionId}
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                <strong>Next Payment Date:</strong> ${nextPaymentDate}
                            </p>
                            <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                Thank you for continuing to use Digitalsite!
                            </p>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 30px;">
                            <div style="border-top: 2px solid #000000;"></div>
                        </td>
                    </tr>

                    <!-- Arabic Content -->
                    <tr>
                        <td style="padding: 40px 30px;" dir="rtl">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #000000;">تم تجديد الإضافة بنجاح</h2>
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                تم تجديد إضافة <strong>${addonNameArabic}</strong> الخاصة بك بنجاح.
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                <strong>رقم الاشتراك:</strong> ${subscriptionId}
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                <strong>تاريخ الدفع التالي:</strong> ${nextPaymentDate}
                            </p>
                            <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.6; color: #000000;">
                                شكراً لك على استمرارك في استخدام ديجيتال سايت!
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; text-align: center; border-top: 2px solid #000000;">
                            <p style="margin: 0; font-size: 14px; color: #000000;">
                                Digitalsite &copy; ${new Date().getFullYear()}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();
}

export function getAddonRenewalEmailText(
  data: AddonRenewalEmailData
): string {
  const { addonType, subscriptionId, nextPaymentDate } = data;

  // Map addon type to display names
  let addonName: string;
  let addonNameArabic: string;

  switch (addonType) {
    case AddOnType.EXTRA_CUSTOM_DOMAIN:
      addonName = "Domain";
      addonNameArabic = "النطاق";
      break;
    case AddOnType.EXTRA_WORKSPACE:
      addonName = "Workspace";
      addonNameArabic = "مساحة العمل";
      break;
    case AddOnType.EXTRA_SUBDOMAIN:
      addonName = "Subdomain";
      addonNameArabic = "النطاق الفرعي";
      break;
    case AddOnType.EXTRA_ADMIN:
      addonName = "Admin";
      addonNameArabic = "مدير";
      break;
    case AddOnType.EXTRA_FUNNEL:
      addonName = "Website"; // Use "Website" instead of "Funnel" - more user-friendly
      addonNameArabic = "الموقع"; // Use "الموقع" (website) instead of "مسار" (funnel)
      break;
    case AddOnType.EXTRA_PAGE:
      addonName = "Page";
      addonNameArabic = "صفحة";
      break;
    default:
      addonName = "Addon";
      addonNameArabic = "إضافة";
  }

  return `
DIGITALSITE

Addon Renewed Successfully

Your ${addonName} addon has been successfully renewed.

Subscription ID: ${subscriptionId}
Next Payment Date: ${nextPaymentDate}

Thank you for continuing to use Digitalsite!

---

تم تجديد الإضافة بنجاح

تم تجديد إضافة ${addonNameArabic} الخاصة بك بنجاح.

رقم الاشتراك: ${subscriptionId}
تاريخ الدفع التالي: ${nextPaymentDate}

شكراً لك على استمرارك في استخدام ديجيتال سايت!

---

Digitalsite © ${new Date().getFullYear()}
  `.trim();
}
