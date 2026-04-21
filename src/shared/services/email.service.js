import transporter from '../config/nodemailer.js';
import { generateVerificationEmailTemplate, generateVerificationEmailText } from '../utils/emailVerificationTemplate.js';
import { EMAIL_FROM_NAME, NODEMAILER_EMAIL, FRONTEND_URL } from '../config/index.js';
import { generateResetPasswordEmailTemplate, generateResetPasswordEmailText } from '../utils/resetPasswordTemplate.js';

export const sendVerificationEmail = async ({ to, userName, verificationToken }) => {
  try {
    // Construct verification link
    const verificationLink = `${FRONTEND_URL}/api/auth/verify-email?token=${verificationToken}`;

    // Generate email HTML template
    const htmlContent = generateVerificationEmailTemplate({
      userName,
      verificationLink
    });

    // Email options
    const mailOptions = {
      from: `"${EMAIL_FROM_NAME}" <${NODEMAILER_EMAIL}>`,
      to,
      subject: `Verify Your Email Address`,
      html: htmlContent,
      // Plain text fallback for email clients that don't support HTML
      text: generateVerificationEmailText({
        userName,
        verificationLink
      })
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Verification email sent successfully:', {
      messageId: info.messageId,
      recipient: to,
      accepted: info.accepted,
      rejected: info.rejected
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    };

  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async ({ to, userName, resetToken }) => {
  try {
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    const htmlContent = generateResetPasswordEmailTemplate({
      userName,
      resetLink
    });

    const mailOptions = {
      from: `"${EMAIL_FROM_NAME}" <${NODEMAILER_EMAIL}>`,
      to,
      subject: `Reset Your Password`,
      html: htmlContent,
      text: generateResetPasswordEmailText({
        userName,
        resetLink
      })
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Password reset email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};