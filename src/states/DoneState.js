import ITaskState from "./ITaskState.js";
import { TASK_STATUSES } from "./taskStatuses.js";

export default class DoneState extends ITaskState {
  constructor() {
    super(TASK_STATUSES.DONE);
  }

  canTransitionTo() {
    return false;
  }
}
