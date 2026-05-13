import { ILogObserver } from "../interfaces/ILogObserver.js";

export class LogObserver extends ILogObserver {
  getLogLevel() {
    return "info";
  }

  async notify(eventName, payload) {
    const timestamp = new Date().toISOString();
    const userEmail = payload.user?.email || "unknown";

    switch (eventName) {
      case "USER_REGISTERED":
        console.log(
          `[LOG][${this.getLogLevel().toUpperCase()}][${timestamp}] ` +
            `NEW USER REGISTERED — email: ${userEmail}`,
        );
        break;

      case "PASSWORD_RESET_REQUESTED":
        console.log(
          `[LOG][${this.getLogLevel().toUpperCase()}][${timestamp}] ` +
            `PASSWORD RESET REQUESTED — email: ${userEmail}`,
        );
        break;

      case "EMAIL_VERIFICATION_REQUESTED":
        console.log(
          `[LOG][${this.getLogLevel().toUpperCase()}][${timestamp}] ` +
            `EMAIL VERIFICATION REQUESTED — email: ${userEmail}`,
        );
        break;

      default:
        console.warn(`[LOG][WARN][${timestamp}] Unknown event: ${eventName}`);
    }
  }
}
