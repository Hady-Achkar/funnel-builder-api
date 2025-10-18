interface SetPasswordTemplateData {
  firstName: string;
  email: string;
  setPasswordLink: string;
}

export const getSetPasswordEmailHtml = (data: SetPasswordTemplateData): string => {
  const { firstName, email, setPasswordLink } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Set Your Password - Digitalsite</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #2c3e50;
            font-size: 32px;
            margin: 0;
            font-weight: 300;
        }
        h2 {
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .info-box p {
            margin: 0;
            color: #495057;
        }
        .credential-item {
            margin: 10px 0;
            font-size: 16px;
        }
        .credential-label {
            font-weight: 600;
            color: #495057;
            display: inline-block;
            width: 80px;
        }
        .credential-value {
            font-family: 'Courier New', Courier, monospace;
            background-color: #ffffff;
            padding: 5px 8px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            color: #495057;
        }
        .set-password-button {
            display: inline-block;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 5px;
            font-weight: 600;
            font-size: 16px;
            margin: 25px 0;
            transition: background-color 0.3s ease;
        }
        .set-password-button:hover {
            background-color: #0056b3;
        }
        .instructions {
            background-color: #e7f3ff;
            border: 1px solid #b3d9ff;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .instructions h4 {
            color: #004085;
            margin-top: 0;
        }
        .instructions ul {
            color: #004085;
            padding-left: 20px;
            margin-bottom: 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #6c757d;
        }
        .security-note {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="logo">
            <h1>Digitalsite</h1>
        </div>

        <h2>Welcome to Digitalsite, ${firstName}! 🎉</h2>

        <p>Thank you for your subscription! Your account has been created successfully.</p>

        <div class="info-box">
            <p><strong>Your account email:</strong></p>
            <div class="credential-item">
                <span class="credential-value">${email}</span>
            </div>
        </div>

        <div class="instructions">
            <h4>📝 Complete Your Account Setup:</h4>
            <ul>
                <li>Click the button below to create your secure password</li>
                <li>Choose a strong password with at least 8 characters</li>
                <li>Once set, you can login and start building amazing funnels!</li>
            </ul>
        </div>

        <div style="text-align: center;">
            <a href="${setPasswordLink}" class="set-password-button">Set Your Password</a>
        </div>

        <div class="security-note">
            <strong>🔒 Security Tip:</strong> This link is secure and will expire in 24 hours. If you didn't create this account, please ignore this email or contact our support team.
        </div>

        <p>If you have any questions or need assistance getting started, don't hesitate to reach out to our support team.</p>

        <div class="footer">
            <p>Best regards,<br>
            <strong>The Digitalsite Team</strong></p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

            <p style="font-size: 12px; color: #999;">
                If you didn't request this, please ignore this email or contact our support team.
            </p>
        </div>
    </div>
</body>
</html>`;
};

export const getSetPasswordEmailText = (data: SetPasswordTemplateData): string => {
  const { firstName, email, setPasswordLink } = data;

  return `
Welcome to Digitalsite, ${firstName}!

Thank you for your subscription! Your account has been created successfully.

YOUR ACCOUNT EMAIL:
${email}

COMPLETE YOUR ACCOUNT SETUP:
1. Click this link to create your secure password: ${setPasswordLink}
2. Choose a strong password with at least 8 characters
3. Once set, you can login and start building amazing funnels!

SECURITY TIP: This link is secure and will expire in 24 hours. If you didn't create this account, please ignore this email or contact our support team.

If you have any questions or need assistance, contact our support team.

Best regards,
The Digitalsite Team

---
If you didn't request this, please ignore this email or contact our support team.
`;
};

export type { SetPasswordTemplateData };
