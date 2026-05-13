import { IEventObserver } from "../IEventObserver.js";

export class INotificationObserver extends IEventObserver {
  notify(eventName, payload) {
    throw new Error(
      `${this.constructor.name} must implement notify(eventName, payload)`,
    );
  }

  getChannel() {
    throw new Error(`${this.constructor.name} must implement getChannel()`);
  }
}
