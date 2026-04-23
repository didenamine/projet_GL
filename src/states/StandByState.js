import ITaskState from "./ITaskState.js";

const ALLOWED_TRANSITIONS = new Set(["InProgress"]);

export default class StandByState extends ITaskState {
  constructor() {
    super("Standby");
  }

  canTransitionTo(nextStatus) {
    return ALLOWED_TRANSITIONS.has(nextStatus);
  }
}