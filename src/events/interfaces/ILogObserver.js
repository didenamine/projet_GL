export class ILogObserver {
  notify(eventName, payload) {
    throw new Error(
      `${this.constructor.name} must implement notify(eventName, payload)`,
    );
  }
}
