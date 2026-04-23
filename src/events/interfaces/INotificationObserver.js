export class INotificationObserver {
  notify(eventName, payload) {
    throw new Error(
      `${this.constructor.name} must implement notify(eventName, payload)`,
    );
  }
}
