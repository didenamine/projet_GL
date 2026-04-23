import { IEmailObserver } from "../interfaces/IEmailObserver.js";

import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  // ❌ supprimer resendVerificationEmail
} from "../../shared/services/email.service.js";

export class EmailNotificationObserver extends IEmailObserver {
  async notify(eventName, payload) {
    switch (eventName) {
      case "USER_REGISTERED":
        await sendVerificationEmail({
          to: payload.user.email,
          userName: payload.user.name,
          verificationToken: payload.user.verificationToken,
        });
        break;

      case "PASSWORD_RESET_REQUESTED":
        await sendPasswordResetEmail({
          to: payload.user.email,
          userName: payload.user.name,
          resetToken: payload.resetToken,
        });
        break;

      // ❌ supprimer le case "EMAIL_VERIFICATION_REQUESTED" entier

      default:
        console.warn(`[EmailObserver] Unknown event: ${eventName}`);
    }
  }
}
