import nodemailer from "nodemailer";
import { Resend } from "resend";
import logger from "./logger.js";

/**
 * Email Service for SuviX
 * Supports both Resend (production) and Gmail SMTP (fallback)
 */

// Check which email provider to use
const isResendConfigured = () => {
  return process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.EMAIL_FROM.includes('@mail.suvix.com');
};

// Create SMTP transporter
const createSmtpTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT) || 465;
  const secure = port === 465;

  logger.info(`Using Gmail SMTP: ${process.env.SMTP_USER}`);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

/**
 * Send an email
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Use Resend if domain is verified and configured
    if (isResendConfigured()) {
      logger.info(`Sending email to ${to} via Resend...`);
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: [to],
        subject,
        html,
        text: text || undefined,
      });

      if (error) {
        throw new Error(error.message);
      }

      logger.info(`Email sent via Resend to ${to}. ID: ${data.id}`);
      return { success: true, messageId: data.id };
    }

    // Fallback to Gmail SMTP
    logger.info(`Sending email to ${to} via Gmail SMTP...`);
    const transporter = createSmtpTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || `"SuviX" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent via SMTP to ${to}: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const subject = "Reset Your Password - SuviX";
  const year = new Date().getFullYear();
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Your Password - SuviX</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; -webkit-font-smoothing: antialiased;">
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        
        <!-- Email Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          
          <!-- HEADER - Dark Black -->
          <tr>
            <td style="background-color: #0f0f0f; padding: 28px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 24px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                      <span style="color: #10b981;">Suvi</span><span style="color: #ffffff;">X</span>
                    </span>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-left: 20px;">
                          <a href="https://instagram.com/suvix" style="display: inline-block; width: 24px; height: 24px; border: 1px solid #4b5563; border-radius: 50%; text-align: center; line-height: 22px; text-decoration: none;">
                            <img src="https://cdn-icons-png.flaticon.com/16/2111/2111463.png" alt="IG" width="12" height="12" style="display: inline-block; vertical-align: middle;" />
                          </a>
                        </td>
                        <td style="padding-left: 12px;">
                          <a href="https://youtube.com/@suvix" style="display: inline-block; width: 24px; height: 24px; border: 1px solid #4b5563; border-radius: 50%; text-align: center; line-height: 22px; text-decoration: none;">
                            <img src="https://cdn-icons-png.flaticon.com/16/1384/1384060.png" alt="YT" width="12" height="12" style="display: inline-block; vertical-align: middle;" />
                          </a>
                        </td>
                        <td style="padding-left: 12px;">
                          <a href="https://twitter.com/suvix" style="display: inline-block; width: 24px; height: 24px; border: 1px solid #4b5563; border-radius: 50%; text-align: center; line-height: 22px; text-decoration: none;">
                            <img src="https://cdn-icons-png.flaticon.com/16/5968/5968830.png" alt="X" width="12" height="12" style="display: inline-block; vertical-align: middle;" />
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CONTENT -->
          <tr>
            <td style="padding: 40px 32px;">
              
              <p style="color: #111827; font-size: 15px; margin: 0 0 28px; line-height: 1.5;">
                Hi <strong>${name}</strong>,
              </p>
              
              <h1 style="color: #111827; font-size: 22px; font-weight: 600; margin: 0 0 16px; line-height: 1.4;">
                Password Reset Request
              </h1>
              
              <p style="color: #4b5563; font-size: 15px; margin: 0 0 28px; line-height: 1.7;">
                We received a request to reset your password for your SuviX account. Click the button below to create a new password.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 28px;">
                <tr>
                  <td align="center" style="background-color: #10b981; border-radius: 6px;">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Warning Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="background-color: #fffbeb; border-left: 3px solid #f59e0b; padding: 14px 16px; border-radius: 0 6px 6px 0;">
                    <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                      <strong>Note:</strong> This link will expire in <strong>1 hour</strong> for security.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              
              <p style="color: #9ca3af; font-size: 13px; margin: 0 0 6px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0; word-break: break-all;">
                <a href="${resetUrl}" style="color: #10b981; font-size: 13px; text-decoration: none;">${resetUrl}</a>
              </p>
              
            </td>
          </tr>
          
          <!-- FOOTER -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0 0 6px; text-align: center;">
                Need help? Contact us at <a href="mailto:support@suvix.com" style="color: #10b981; text-decoration: none;">support@suvix.com</a>
              </p>
              <p style="color: #d1d5db; font-size: 12px; margin: 0; text-align: center;">
                &copy; ${year} SuviX Technologies Pvt. Ltd. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Security Notice -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; margin-top: 20px;">
          <tr>
            <td align="center">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is a secure, automated email from SuviX. Never share your password.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;
  
  const text = `Hi ${name},

Password Reset Request

We received a request to reset your password for your SuviX account.

Click here to reset your password: ${resetUrl}

Note: This link will expire in 1 hour for security.

If you didn't request a password reset, you can safely ignore this email.

---
Need help? Contact us at support@suvix.com

(c) ${year} SuviX Technologies Pvt. Ltd. All rights reserved.`;
  
  return sendEmail({ to: email, subject, html, text });
};

export default { sendEmail, sendPasswordResetEmail };
