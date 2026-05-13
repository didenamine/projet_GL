import { INotificationObserver } from "../interfaces/INotificationObserver.js";

export class SMSObserver extends INotificationObserver {
  getChannel() {
    return "SMS";
  }

  async notify(eventName, payload) {
    const userEmail = payload.user?.email || "unknown";

    switch (eventName) {
      case "USER_REGISTERED":
        console.log(
          `[SMS][${this.getChannel()}] Sending SMS to ${userEmail} — ` +
            `Welcome! Please verify your account.`,
        );
        break;

      case "PASSWORD_RESET_REQUESTED":
        console.log(
          `[SMS][${this.getChannel()}] Sending SMS to ${userEmail} — ` +
            `Password reset requested. Token: ${payload.resetToken}`,
        );
        break;

      case "EMAIL_VERIFICATION_REQUESTED":
        console.log(
          `[SMS][${this.getChannel()}] Sending SMS to ${userEmail} — ` +
            `Please verify your email address.`,
        );
        break;

      default:
        console.warn(`[SMS][WARN] Unknown event: ${eventName}`);
    }
  }
}
