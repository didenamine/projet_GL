import ITaskState from "./ITaskState.js";
import { TASK_STATUSES } from "./taskStatuses.js";

const ALLOWED_TRANSITIONS = new Set([TASK_STATUSES.STANDBY, TASK_STATUSES.DONE]);

export default class InProgressState extends ITaskState {
  constructor() {
    super(TASK_STATUSES.IN_PROGRESS);
  }

  canTransitionTo(nextStatus) {
    return ALLOWED_TRANSITIONS.has(nextStatus);
  }
}
