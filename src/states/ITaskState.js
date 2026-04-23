export default class ITaskState {
  constructor(name) {
    if (new.target === ITaskState) {
      throw new Error("ITaskState is abstract and cannot be instantiated directly.");
    }
    this.name = name;
  }

  getStatus() {
    return this.name;
  }

  canTransitionTo(_nextStatus) {
    throw new Error("canTransitionTo must be implemented by subclasses.");
  }

  assertCanTransitionTo(nextStatus) {
    if (!this.canTransitionTo(nextStatus)) {
      const error = new Error(
        `Invalid task status transition from "${this.name}" to "${nextStatus}".`
      );
      error.status = 400;
      throw error;
    }
  }
}