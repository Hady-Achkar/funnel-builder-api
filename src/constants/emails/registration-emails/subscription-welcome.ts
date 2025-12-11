interface SubscriptionWelcomeTemplateData {
  firstName: string;
  email: string;
  temporaryPassword: string;
  verificationLink: string;
}

export const getSubscriptionWelcomeEmailHtml = (data: SubscriptionWelcomeTemplateData): string => {
  const { firstName, email, temporaryPassword, verificationLink } = data;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Digitalsite</title>
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
        .credentials-box {
            background-color: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .credentials-box h3 {
            color: #495057;
            margin-top: 0;
            font-size: 18px;
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
        .verify-button {
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
        .verify-button:hover {
            background-color: #0056b3;
        }
        .instructions {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .instructions h4 {
            color: #856404;
            margin-top: 0;
        }
        .instructions ul {
            color: #856404;
            padding-left: 20px;
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
        
        <h2>Welcome, ${firstName}! 🎉</h2>
        
        <p>Thank you for subscribing to Digitalsite! Your account has been created successfully and we're excited to have you on board.</p>
        
        <div class="credentials-box">
            <h3>📋 Your Login Credentials</h3>
            <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${email}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Password:</span>
                <span class="credential-value">${temporaryPassword}</span>
            </div>
        </div>
        
        <div class="instructions">
            <h4>📝 Next Steps:</h4>
            <ul>
                <li><strong>Verify your email</strong> by clicking the button below</li>
                <li><strong>Login</strong> to your account using the credentials above</li>
                <li><strong>Change your password</strong> from your account settings for security</li>
                <li><strong>Start building</strong> amazing funnels!</li>
            </ul>
        </div>
        
        <div style="text-align: center;">
            <a href="${verificationLink}" class="verify-button">Verify Email Address</a>
        </div>
        
        <div class="security-note">
            <strong>🔒 Security Reminder:</strong> For your account security, please change this temporary password after your first login. You can do this from your account settings page.
        </div>
        
        <p>If you have any questions or need assistance getting started, don't hesitate to reach out to our support team.</p>
        
        <div class="footer">
            <p>Best regards,<br>
            <strong>The Digitalsite Team</strong></p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #999;">
                If you didn't create this account, please ignore this email or contact our support team.
            </p>
        </div>
    </div>
</body>
</html>`;
};

export const getSubscriptionWelcomeEmailText = (data: SubscriptionWelcomeTemplateData): string => {
  const { firstName, email, temporaryPassword, verificationLink } = data;
  
  return `
Welcome to Digitalsite, ${firstName}!

Thank you for subscribing to Digitalsite! Your account has been created successfully.

YOUR LOGIN CREDENTIALS:
Email: ${email}
Password: ${temporaryPassword}

NEXT STEPS:
1. Verify your email by clicking this link: ${verificationLink}
2. Login to your account using the credentials above
3. Change your password from your account settings for security
4. Start building amazing funnels!

SECURITY REMINDER: For your account security, please change this temporary password after your first login.

If you have any questions or need assistance, contact our support team.

Best regards,
The Digitalsite Team

---
If you didn't create this account, please ignore this email or contact our support team.
`;
};

export type { SubscriptionWelcomeTemplateData };