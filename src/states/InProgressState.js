import ITaskState from "./ITaskState.js";

const ALLOWED_TRANSITIONS = new Set(["Standby", "Done"]);

export default class InProgressState extends ITaskState {
  constructor() {
    super("InProgress");
  }

  canTransitionTo(nextStatus) {
    return ALLOWED_TRANSITIONS.has(nextStatus);
  }
}