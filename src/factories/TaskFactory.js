import Task      from "../modules/Team_C/models/task.model.js";
import UserStory from "../modules/Team_B/models/UserStory.model.js";

const VALID_STATUSES        = ["ToDo", "InProgress", "Standby", "Done"];
const VALID_PRIORITIES_TASK = ["Low", "Medium", "High"];
const VALID_PRIORITIES_US   = ["grand","highest", "high", "medium", "low", "lowest"];

export class TaskFactory {

  static create({ title, description = "", status, priority = "Medium", userStoryId, assignedTo }) {
    if (!title?.trim()) {
      const err = new Error("Task title is required"); err.status = 400; throw err;
    }
    if (!userStoryId) {
      const err = new Error("Task userStoryId is required"); err.status = 400; throw err;
    }
    if (!VALID_STATUSES.includes(status)) {
      const err = new Error(`Task status must be one of: ${VALID_STATUSES.join(", ")}`); err.status = 400; throw err;
    }
    if (!VALID_PRIORITIES_TASK.includes(priority)) {
      const err = new Error(`Task priority must be one of: ${VALID_PRIORITIES_TASK.join(", ")}`); err.status = 400; throw err;
    }
    return new Task({
      title:       title.trim(),
      description: description.trim(),
      status,
      priority,
      userStoryId,
      ...(assignedTo && { assignedTo }),
    });
  }

  static createUserStory({ storyName, description = "", priority, storyPointEstimate, startDate, dueDate, sprintId }) {
    if (!storyName?.trim()) {
      const err = new Error("UserStory storyName is required"); err.status = 400; throw err;
    }
    if (!sprintId) {
      const err = new Error("UserStory sprintId is required"); err.status = 400; throw err;
    }
    if (!VALID_PRIORITIES_US.includes(priority)) {
      const err = new Error(`UserStory priority must be one of: ${VALID_PRIORITIES_US.join(", ")}`); err.status = 400; throw err;
    }
    if (typeof storyPointEstimate !== "number" || storyPointEstimate < 0) {
      const err = new Error("UserStory storyPointEstimate must be a non-negative number"); err.status = 400; throw err;
    }
    const start = new Date(startDate);
    const due   = new Date(dueDate);
    if (isNaN(start.getTime()) || isNaN(due.getTime())) {
      const err = new Error("UserStory dates must be valid ISO dates"); err.status = 400; throw err;
    }
    if (due <= start) {
      const err = new Error("UserStory dueDate must be strictly after startDate"); err.status = 400; throw err;
    }
    return new UserStory({
      storyName:          storyName.trim(),
      description:        description.trim(),
      priority,
      storyPointEstimate,
      startDate:          start,
      dueDate:            due,
      sprintId,
      tasks:              [],
    });
  }
}
