import { IEmailObserver } from "../interfaces/IEmailObserver.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../../shared/services/email.service.js";

export class EmailNotificationObserver extends IEmailObserver {
  async notify(eventName, payload) {
    switch (eventName) {
      case "USER_REGISTERED":
        await sendVerificationEmail({
          to: payload.user.email,
          userName: payload.user.fullName,
          verificationToken: payload.user.verificationToken,
        });
        console.log(
          `[EmailObserver] Verification email sent to ${payload.user.email}`,
        );
        break;

      case "PASSWORD_RESET_REQUESTED":
        await sendPasswordResetEmail({
          to: payload.user.email,
          userName: payload.user.fullName,
          resetToken: payload.resetToken,
        });
        console.log(
          `[EmailObserver] Password reset email sent to ${payload.user.email}`,
        );
        break;

      case "EMAIL_VERIFICATION_REQUESTED":
        await sendVerificationEmail({
          to: payload.user.email,
          userName: payload.user.fullName,
          verificationToken: payload.user.verificationToken,
        });
        console.log(
          `[EmailObserver] Verification email resent to ${payload.user.email}`,
        );
        break;

      default:
        console.warn(`[EmailObserver] Unknown event: ${eventName}`);
    }
  }
}
