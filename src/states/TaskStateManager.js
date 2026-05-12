import ToDoState from "./ToDoState.js";
import InProgressState from "./InProgressState.js";
import StandbyState from "./StandbyState.js";
import DoneState from "./DoneState.js";

const STATE_FACTORIES = {
  ToDo: () => new ToDoState(),
  InProgress: () => new InProgressState(),
  Standby: () => new StandbyState(),
  Done: () => new DoneState(),
};

function buildState(status) {
  const factory = STATE_FACTORIES[status];
  if (!factory) {
    const error = new Error(`Unknown task status "${status}".`);
    error.status = 400;
    throw error;
  }
  return factory();
}

function assertTaskLike(task) {
  if (!task || typeof task !== "object") {
    const error = new Error("A task object is required.");
    error.status = 400;
    throw error;
  }

  if (!("status" in task)) {
    const error = new Error("Task must expose a status field.");
    error.status = 400;
    throw error;
  }
}

/**
 * Coordinates task status changes: it is the State pattern context for
 * transition rules, and can be described as a GRASP Controller because it
 * receives the status-change request and delegates it to the proper state.
 */
export default class TaskStateManager {
  static transition(task, newStatus) {
    assertTaskLike(task);

    if (typeof newStatus !== "string" || !newStatus.trim()) {
      const error = new Error("Target status is required.");
      error.status = 400;
      throw error;
    }

    const normalizedStatus = newStatus.trim();
    const currentState = buildState(task.status);

    // Ensure the target status exists in the managed state graph.
    buildState(normalizedStatus);

    currentState.assertCanTransitionTo(normalizedStatus);
    task.status = normalizedStatus;
    return task;
  }
}
