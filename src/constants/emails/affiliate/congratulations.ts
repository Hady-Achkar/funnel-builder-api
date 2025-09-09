export const getAffiliateCongratulationsEmailHtml = (): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎉 Congratulations! New Referral Success</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .celebration-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 48px;
            margin: 0 0 20px 0;
            font-weight: bold;
        }
        .main-title {
            color: #2c3e50;
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        .success-message {
            font-size: 18px;
            color: #495057;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        .celebration-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin: 30px 0;
        }
        .celebration-box h3 {
            margin: 0 0 15px 0;
            font-size: 22px;
            font-weight: 600;
        }
        .celebration-box p {
            margin: 0;
            font-size: 16px;
            opacity: 0.95;
        }
        .stats-container {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        .stat-box {
            background-color: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            padding: 20px;
            min-width: 120px;
            flex: 1;
        }
        .stat-icon {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .stat-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 1px;
        }
        .stat-value {
            font-size: 18px;
            color: #495057;
            font-weight: 600;
            margin-top: 5px;
        }
        .motivation-section {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 10px;
            padding: 25px;
            margin: 30px 0;
        }
        .motivation-section h4 {
            color: #856404;
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .motivation-section p {
            color: #856404;
            margin: 0;
            font-size: 16px;
        }
        .commission-highlight {
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 25px 0;
        }
        .commission-highlight h4 {
            margin: 0 0 10px 0;
            font-size: 20px;
        }
        .commission-highlight p {
            margin: 0;
            font-size: 16px;
            opacity: 0.95;
        }
        .footer {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 2px solid #e9ecef;
            font-size: 14px;
            color: #6c757d;
        }
        .company-signature {
            color: #495057;
            font-weight: 600;
            margin-top: 15px;
        }
        .emoji {
            font-size: 24px;
            margin: 0 5px;
        }
        @media (max-width: 600px) {
            .stats-container {
                flex-direction: column;
            }
            .stat-box {
                min-width: auto;
            }
            .celebration-header {
                font-size: 36px;
            }
            .main-title {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="celebration-header">🎉</div>
        
        <h1 class="main-title">Congratulations!</h1>
        
        <p class="success-message">
            Amazing news! Someone just joined Digitalsite using your affiliate link. 
            Your referral efforts are paying off!
        </p>
        
        <div class="celebration-box">
            <h3><span class="emoji">🚀</span> New Referral Success <span class="emoji">🚀</span></h3>
            <p>
                A new user has successfully subscribed to our platform through your affiliate link. 
                Keep up the fantastic work!
            </p>
        </div>
        
        <div class="stats-container">
            <div class="stat-box">
                <div class="stat-icon">👥</div>
                <div class="stat-label">Status</div>
                <div class="stat-value">New Referral</div>
            </div>
            <div class="stat-box">
                <div class="stat-icon">💰</div>
                <div class="stat-label">Commission</div>
                <div class="stat-value">Earned</div>
            </div>
            <div class="stat-box">
                <div class="stat-icon">📈</div>
                <div class="stat-label">Growth</div>
                <div class="stat-value">Increasing</div>
            </div>
        </div>
        
        <div class="commission-highlight">
            <h4><span class="emoji">💸</span> Commission Earned!</h4>
            <p>
                Your commission has been added to your account balance. 
                Keep sharing to earn more!
            </p>
        </div>
        
        <div class="motivation-section">
            <h4><span class="emoji">🔥</span> Keep the Momentum Going!</h4>
            <p>
                Every referral brings you closer to your goals. Share your affiliate link 
                with friends, colleagues, and your network to maximize your earnings. 
                The more you share, the more you earn!
            </p>
        </div>
        
        <div class="footer">
            <p>
                Thank you for being an amazing affiliate partner. Your efforts help us grow 
                the Digitalsite community while rewarding you for your dedication.
            </p>
            
            <div class="company-signature">
                <p>Best regards,<br>
                <strong>The Digitalsite Team</strong></p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #adb5bd;">
                This email was sent because someone successfully subscribed using your affiliate link. 
                Keep sharing to earn more commissions!
            </p>
        </div>
    </div>
</body>
</html>`;
};

export const getAffiliateCongratulationsEmailText = (): string => {
  return `
🎉 CONGRATULATIONS! 🎉

Amazing news! Someone just joined Digitalsite using your affiliate link.

NEW REFERRAL SUCCESS
A new user has successfully subscribed to our platform through your affiliate link. Keep up the fantastic work!

STATUS: New Referral ✓
COMMISSION: Earned ✓  
GROWTH: Increasing ✓

💸 COMMISSION EARNED!
Your commission has been added to your account balance. Keep sharing to earn more!

🔥 KEEP THE MOMENTUM GOING!
Every referral brings you closer to your goals. Share your affiliate link with friends, colleagues, and your network to maximize your earnings. The more you share, the more you earn!

Thank you for being an amazing affiliate partner. Your efforts help us grow the Digitalsite community while rewarding you for your dedication.

Best regards,
The Digitalsite Team

---
This email was sent because someone successfully subscribed using your affiliate link. Keep sharing to earn more commissions!
`;
};