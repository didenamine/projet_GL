import ITaskState from "./ITaskState.js";
import { TASK_STATUSES } from "./taskStatuses.js";

const ALLOWED_TRANSITIONS = new Set([TASK_STATUSES.IN_PROGRESS]);

export default class StandbyState extends ITaskState {
  constructor() {
    super(TASK_STATUSES.STANDBY);
  }

  canTransitionTo(nextStatus) {
    return ALLOWED_TRANSITIONS.has(nextStatus);
  }
}
