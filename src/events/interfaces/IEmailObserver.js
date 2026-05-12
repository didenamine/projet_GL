import { IEventObserver } from "../IEventObserver.js";

export class IEmailObserver extends IEventObserver {
  notify(eventName, payload) {
    throw new Error(
      `${this.constructor.name} must implement notify(eventName, payload)`,
    );
  }
}
