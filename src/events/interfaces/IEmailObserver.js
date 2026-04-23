export class IEmailObserver {
  notify(eventName, payload) {
    throw new Error(`${this.constructor.name} must implement notify()`);
  }
}
