class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  subscribe(eventName, observer) {
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, new Set());
    }
    this._listeners.get(eventName).add(observer);
    console.log(`[EventBus] Subscribed to "${eventName}"`);
  }

  unsubscribe(eventName, observer) {
    if (this._listeners.has(eventName)) {
      this._listeners.get(eventName).delete(observer);
    }
  }

  async publish(eventName, payload) {
    console.log(`[EventBus] Publishing "${eventName}"`);
    if (!this._listeners.has(eventName)) return;
    const observers = this._listeners.get(eventName);
    await Promise.all(
      [...observers].map((observer) =>
        Promise.resolve(observer.notify(eventName, payload)).catch((err) =>
          console.error(`[EventBus] Error in observer:`, err),
        ),
      ),
    );
  }
}

export default new EventBus();
