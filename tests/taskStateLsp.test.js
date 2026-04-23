import test from "node:test";
import assert from "node:assert/strict";

import ITaskState from "../src/states/ITaskState.js";
import ToDoState from "../src/states/ToDoState.js";
import InProgressState from "../src/states/InProgressState.js";
import StandByState from "../src/states/StandByState.js";
import DoneState from "../src/states/DoneState.js";
import TaskStateManager from "../src/states/TaskStateManager.js";

function evaluateAsAbstractState(state) {
  assert.ok(state instanceof ITaskState);
  assert.equal(typeof state.getStatus, "function");
  assert.equal(typeof state.canTransitionTo, "function");

  // Any concrete state can be consumed via the abstract contract.
  return {
    status: state.getStatus(),
    allowsInProgress: state.canTransitionTo("InProgress"),
  };
}

test("LSP: all concrete states are substitutable for ITaskState", () => {
  const states = [
    new ToDoState(),
    new InProgressState(),
    new StandByState(),
    new DoneState(),
  ];

  for (const state of states) {
    assert.doesNotThrow(() => evaluateAsAbstractState(state));
  }
});

test("TaskStateManager enforces allowed transitions", () => {
  const task = { status: "ToDo" };
  TaskStateManager.transition(task, "InProgress");
  assert.equal(task.status, "InProgress");
});

test("TaskStateManager blocks forbidden transitions", () => {
  const task = { status: "Done" };
  assert.throws(() => TaskStateManager.transition(task, "InProgress"), {
    message: /Invalid task status transition/,
  });
});