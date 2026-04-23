import mongoose from "mongoose";
import Task from "../modules/Team_C/models/task.model.js";
import UserStory from "../modules/Team_B/models/UserStory.model.js";
import Sprint from "../modules/Team_A/models/sprint.model.js";
import Project from "../modules/Team_A/models/project.model.js";
import Meeting from "../modules/Team_D/models/meeting.model.js";

export default class IValidator {
  constructor(supervisorId) {
    if (new.target === IValidator) {
      throw new Error("IValidator is an abstract class and cannot be instantiated directly.");
    }

    if (!supervisorId) {
      throw new Error("supervisorId is required to create a validator.");
    }

    this.supervisorId = supervisorId;
  }

  async validate(validationData) {
    const { taskId, status, meetingType, meetingReference } = validationData;

    if (!taskId || !status || !meetingType) {
      return false;
    }

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return false;
    }

    const task = await Task.findById(taskId);
    if (!task || task.status !== "Done") {
      return false;
    }

    if (meetingType === "reunion") {
      if (!meetingReference || !mongoose.Types.ObjectId.isValid(meetingReference)) {
        return false;
      }

      const meeting = await Meeting.findById(meetingReference);
      if (!meeting) {
        return false;
      }
    }

    return await this.canValidate(taskId, this.supervisorId);
  }

  getType() {
    throw new Error("getType() must be implemented by a concrete validator.");
  }

  async canValidate(taskId, supervisorId) {
    throw new Error("canValidate() must be implemented by a concrete validator.");
  }

  async _loadTaskProject(taskId) {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return null;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return null;
    }

    const userStory = await UserStory.findById(task.userStoryId);
    if (!userStory) {
      return null;
    }

    const sprint = await Sprint.findById(userStory.sprintId);
    if (!sprint) {
      return null;
    }

    const project = await Project.findById(sprint.projectId).populate("contributors");
    if (!project) {
      return null;
    }

    return { task, userStory, sprint, project };
  }
}
