import { IEmailObserver } from "../interfaces/IEmailObserver.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../../shared/services/email.service.js";

export class EmailNotificationObserver extends IEmailObserver {
  getSupportedEmailEvents() {
    return [
      "USER_REGISTERED",
      "PASSWORD_RESET_REQUESTED",
      "EMAIL_VERIFICATION_REQUESTED",
    ];
  }

  async notify(eventName, payload) {
    switch (eventName) {
      case "USER_REGISTERED":
        await sendVerificationEmail({
          to: payload.user.email,
          userName: payload.user.fullName,
          verificationToken: payload.user.verificationToken,
        });
        break;
      case "PASSWORD_RESET_REQUESTED":
        await sendPasswordResetEmail({
          to: payload.user.email,
          userName: payload.user.fullName,
          resetToken: payload.resetToken,
        });
        break;
      case "EMAIL_VERIFICATION_REQUESTED":
        await sendVerificationEmail({
          to: payload.user.email,
          userName: payload.user.fullName,
          verificationToken: payload.user.verificationToken,
        });
        break;
      default:
        console.warn(`[EmailObserver] Unknown event: ${eventName}`);
    }
  }
}
