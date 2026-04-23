import ITaskState from "./ITaskState.js";

const ALLOWED_TRANSITIONS = new Set(["InProgress"]);

export default class ToDoState extends ITaskState {
  constructor() {
    super("ToDo");
  }

  canTransitionTo(nextStatus) {
    return ALLOWED_TRANSITIONS.has(nextStatus);
  }
}