import ITaskState from "./ITaskState.js";

export default class DoneState extends ITaskState {
  constructor() {
    super("Done");
  }

  canTransitionTo(_nextStatus) {
    return false;
  }
}