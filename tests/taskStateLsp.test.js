import test from "node:test";
import assert from "node:assert/strict";

import ITaskState from "../src/states/ITaskState.js";
import ToDoState from "../src/states/ToDoState.js";
import InProgressState from "../src/states/InProgressState.js";
import StandbyState from "../src/states/StandbyState.js";
import DoneState from "../src/states/DoneState.js";
import TaskStateManager from "../src/states/TaskStateManager.js";
import { TASK_STATUSES } from "../src/states/taskStatuses.js";

function evaluateAsAbstractState(state) {
  assert.ok(state instanceof ITaskState);
  assert.equal(typeof state.getStatus, "function");
  assert.equal(typeof state.canTransitionTo, "function");

  // Any concrete state can be consumed via the abstract contract.
  return {
    status: state.getStatus(),
    allowsInProgress: state.canTransitionTo(TASK_STATUSES.IN_PROGRESS),
  };
}

test("LSP: all concrete states are substitutable for ITaskState", () => {
  const states = [
    new ToDoState(),
    new InProgressState(),
    new StandbyState(),
    new DoneState(),
  ];

  for (const state of states) {
    assert.doesNotThrow(() => evaluateAsAbstractState(state));
  }
});

test("TaskStateManager enforces allowed transitions", () => {
  const allowedTransitions = [
    [TASK_STATUSES.TODO, TASK_STATUSES.IN_PROGRESS],
    [TASK_STATUSES.IN_PROGRESS, TASK_STATUSES.STANDBY],
    [TASK_STATUSES.IN_PROGRESS, TASK_STATUSES.DONE],
    [TASK_STATUSES.STANDBY, TASK_STATUSES.IN_PROGRESS],
  ];

  for (const [currentStatus, nextStatus] of allowedTransitions) {
    const task = { status: currentStatus };
    TaskStateManager.transition(task, nextStatus);
    assert.equal(task.status, nextStatus);
  }
});

test("TaskStateManager validates transitions without mutating the task", () => {
  const task = { status: TASK_STATUSES.IN_PROGRESS };

  assert.equal(TaskStateManager.canTransition(task, TASK_STATUSES.STANDBY), true);
  assert.doesNotThrow(() => TaskStateManager.assertCanTransition(task, TASK_STATUSES.STANDBY));
  assert.equal(task.status, TASK_STATUSES.IN_PROGRESS);
});

test("TaskStateManager blocks forbidden transitions", () => {
  const forbiddenTransitions = [
    [TASK_STATUSES.TODO, TASK_STATUSES.STANDBY],
    [TASK_STATUSES.TODO, TASK_STATUSES.DONE],
    [TASK_STATUSES.STANDBY, TASK_STATUSES.DONE],
    [TASK_STATUSES.DONE, TASK_STATUSES.IN_PROGRESS],
  ];

  for (const [currentStatus, nextStatus] of forbiddenTransitions) {
    const task = { status: currentStatus };
    assert.equal(TaskStateManager.canTransition(task, nextStatus), false);
    assert.throws(() => TaskStateManager.transition(task, nextStatus), {
      message: /Invalid task status transition/,
    });
  }
});

test("TaskStateManager rejects unknown statuses", () => {
  assert.throws(() => TaskStateManager.transition({ status: TASK_STATUSES.IN_PROGRESS }, "StandBy"), {
    message: /Unknown task status/,
  });

  assert.throws(() => TaskStateManager.transition({ status: "Blocked" }, TASK_STATUSES.IN_PROGRESS), {
    message: /Unknown task status/,
  });
});

test("TaskStateManager rejects blank target status", () => {
  assert.throws(() => TaskStateManager.transition({ status: TASK_STATUSES.TODO }, " "), {
    message: /Target status is required/,
  });
});
