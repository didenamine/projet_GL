import Task from "../models/task.model.js";
import Project from "../../Team_A/models/project.model.js";
import CompSupervisor from "../../Authentication/models/compSupervisor.model.js";
import UnivSupervisor from "../../Authentication/models/uniSupervisor.model.js";
import UserStory from "../../Team_B/models/UserStory.model.js";
import TaskValidator from "../models/taskValidator.model.js";
import TaskHistory from "../models/taskHistory.model.js";
import Sprint from "../../Team_A/models/sprint.model.js";
import ValidatorFactory from "../../../validators/ValidatorFactory.js";
import TaskStateManager from "../../../states/TaskStateManager.js";
import { taskCreator } from "../../../factories/TaskCreator.js";

async function verifyUserStoryExists(userStoryId) {
  const userStory = await UserStory.findById(userStoryId);
  if (!userStory) {
    const error = new Error("User story not found.");
    error.status = 404;
    throw error;
  }
  return true;
}

export const createTask = async (data) => {
  const { title, userStoryId } = data;
  if (!title || !userStoryId) {
    const error = new Error("Title and userStoryId are required.");
    error.status = 400;
    throw error;
  }

  await verifyUserStoryExists(userStoryId);

  const existing = await Task.findOne({ title, userStoryId });
  if (existing) {
    const error = new Error("Task with this title already exists for this user story.");
    error.status = 409;
    throw error;
  }

  // ── GRASP Creator + Factory Method : création et validation déléguées au TaskCreator ──
  const newTask = taskCreator.create(data);
  const savedTask = await newTask.save();
  // ──────────────────────────────────────────────────────────────────────────────────────

  await UserStory.findByIdAndUpdate(userStoryId, {
    $push: { tasks: savedTask._id }
  });

  return savedTask;
};

export const getAllTasksForCompSupvisor = async (compSupervisorId) => {
  const compSupervisor = await CompSupervisor.findById(compSupervisorId).populate('studentsId');
  if (!compSupervisor) {
    const error = new Error("Company supervisor not found.");
    error.status = 404;
    throw error;
  }

  const studentIds = compSupervisor.studentsId.map(student => student._id);
  const projects = await Project.find({ contributors: { $in: studentIds } }).populate('sprints');
  const sprintIds = projects.flatMap(project => project.sprints.map(sprint => sprint._id));
  const userStories = await UserStory.find({ sprintId: { $in: sprintIds } });
  const userStoryIds = userStories.map(userStory => userStory._id);
  const tasks = await Task.find({ userStoryId: { $in: userStoryIds } });
  return { message: "Tasks retrieved successfully", tasks };
};

export const getAllTasksForUnivSupervisor = async (univSupervisorId) => {
  const univSupervisor = await UnivSupervisor.findById(univSupervisorId).populate('studentsId');
  if (!univSupervisor) {
    const error = new Error("University supervisor not found.");
    error.status = 404;
    throw error;
  }

  const studentIds = univSupervisor.studentsId.map(student => student._id);
  const projects = await Project.find({ contributors: { $in: studentIds } }).populate('sprints');
  const sprintIds = projects.flatMap(project => project.sprints.map(sprint => sprint._id));
  const userStories = await UserStory.find({ sprintId: { $in: sprintIds } });
  const userStoryIds = userStories.map(userStory => userStory._id);
  const tasks = await Task.find({ userStoryId: { $in: userStoryIds } });
  return { message: "Tasks retrieved successfully", tasks };
};

export const getTaskById = async (id) => {
  const task = await Task.findById(id);
  if (!task) {
    const error = new Error("Task not found.");
    error.status = 404;
    throw error;
  }
  return { message: "Task retrieved successfully", task };
};

export const deleteTask = async (id) => {
  const task = await Task.findByIdAndDelete(id);
  if (!task) {
    const error = new Error("Task not found.");
    error.status = 404;
    throw error;
  }

  await TaskValidator.deleteMany({ task_id: id });

  await UserStory.findByIdAndUpdate(task.userStoryId, {
    $pull: { tasks: id }
  });

  return { message: "Task deleted successfully", task };
};

export const getAllTasksForUserStory = async (userStoryId) => {
  const tasks = await Task.find({ userStoryId });
  if (!tasks.length) {
    const error = new Error("No tasks found for this user story.");
    error.status = 404;
    throw error;
  }
  return { message: "Tasks retrieved successfully", tasks };
};

export const updateTaskStatus = async (id, data) => {
  const task = await Task.findById(id);
  if (!task) {
    const error = new Error("Task not found.");
    error.status = 404;
    throw error;
  }

  TaskStateManager.transition({ status: task.status }, data.status);

  const taskValidator = await TaskValidator.create({
    taskId: id,
    taskStatus: data.status,
    validatorId: data.validatorId,
    comment: data.comment,
    meetingType: data.meetingType
  });

  return { message: "Task status validation request created successfully", taskValidator };
};

export const validateTaskStatus = async (id, data, validatorRole) => {
  const taskValidator = await TaskValidator.findById(id);
  if (!taskValidator) {
    const error = new Error("Task validator not found.");
    error.status = 404;
    throw error;
  }
  const task = await Task.findById(taskValidator.taskId);
  if (!task) {
    const error = new Error("Task not found.");
    error.status = 404;
    throw error;
  }

  const validator = ValidatorFactory.get(validatorRole, data.validatorId);
  const canValidate = await validator.canValidate(task._id, data.validatorId);
  if (!canValidate) {
    const error = new Error("You are not authorized to validate this task.");
    error.status = 403;
    throw error;
  }

  if (data.validatorStatus === "valid") {
    const oldStatus = task.status;
    TaskStateManager.transition(task, taskValidator.taskStatus);
    await task.save();

    await TaskHistory.create({
      taskId: task._id,
      modifiedBy: taskValidator.validatorId,
      oldValue: { status: oldStatus },
      newValue: { status: taskValidator.taskStatus },
      fieldChanged: "status"
    });

    await TaskValidator.findByIdAndDelete(id);
    return { message: "Task status updated and validated successfully", task };
  } else {
    taskValidator.status = data.validatorStatus;
    await taskValidator.save();
    return { message: "Task validation request updated", taskValidator };
  }
};

export const makeFullReport = async (projectId) => {
  const project = await Project.findById(projectId).populate('sprints');
  if (!project) {
    const error = new Error("Project not found.");
    error.status = 404;
    throw error;
  }

  const sprints = await Sprint.find({ projectId: projectId });
  const sprintIds = sprints.map(sprint => sprint._id);

  const userStories = await UserStory.find({ sprintId: { $in: sprintIds } });
  const userStoryIds = userStories.map(us => us._id);

  const tasks = await Task.find({ userStoryId: { $in: userStoryIds } });

  return {
    project: {
      title: project.title,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
    },
    sprints: sprints.map(sprint => ({
      name: sprint.title,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    })),
    userStories: userStories.map(userStory => ({
      name: userStory.storyName,
      description: userStory.description,
      priority: userStory.priority,
      storyPointEstimate: userStory.storyPointEstimate,
      startDate: userStory.startDate,
      dueDate: userStory.dueDate,
    })),
    tasks: tasks.map(task => ({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
    })),
  };
};

export const makeSprintReport = async (sprintId) => {
  const sprint = await Sprint.findById(sprintId).populate('userStories');
  if (!sprint) {
    const error = new Error("Sprint not found.");
    error.status = 404;
    throw error;
  }

  const userStories = await UserStory.find({ sprintId: sprintId });
  const userStoryIds = userStories.map(us => us._id);

  const tasks = await Task.find({ userStoryId: { $in: userStoryIds } });

  return {
    sprint: {
      title: sprint.title,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    },
    userStories: userStories.map(userStory => ({
      name: userStory.storyName,
      description: userStory.description,
      priority: userStory.priority,
      storyPointEstimate: userStory.storyPointEstimate,
      startDate: userStory.startDate,
      dueDate: userStory.dueDate,
    })),
    tasks: tasks.map(task => ({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
    })),
  };
};