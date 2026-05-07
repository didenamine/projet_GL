import mongoose from "mongoose";
import UserStory from "../models/UserStory.model.js";
import Sprint from "../../Team_A/models/sprint.model.js";
import Project from "../../Team_A/models/project.model.js";
import Student from "../../Authentication/models/student.model.js";
import Task from "../../Team_C/models/task.model.js";
import { userStoryCreator } from "../../../factories/UserStoryCreator.js";

// 📌 CREATE USER STORY
export const createUserStory = async (data, studentId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { storyName, description, priority, storyPointEstimate, startDate, dueDate, sprintId } = data;

    const student = await Student.findById(studentId).session(session);

    if (!student) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }

    if (!student.project) {
      const error = new Error("Student has no assigned project");
      error.statusCode = 400;
      throw error;
    }

    const sprint = await Sprint.findById(sprintId).session(session);

    if (!sprint || sprint.deletedAt) {
      const error = new Error("Sprint not found or deleted");
      error.statusCode = 404;
      throw error;
    }

    if (String(sprint.projectId) !== String(student.project)) {
      const error = new Error("Sprint does not belong to your project");
      error.statusCode = 403;
      throw error;
    }

    const existingUserStory = await UserStory.findOne({
      storyName,
      sprintId,
      deletedAt: null
    }).session(session);

    if (existingUserStory) {
      const error = new Error("A user story with this name already exists in this sprint");
      error.statusCode = 409;
      throw error;
    }

    // ── GRASP Creator + Factory Method : création et validation déléguées au UserStoryCreator ──
    const newUserStory = userStoryCreator.create({
      storyName,
      description,
      priority,
      storyPointEstimate,
      startDate,
      dueDate,
      sprintId,
    });
    // ────────────────────────────────────────────────────────────────────────────────────────────

    const savedStory = await newUserStory.save({ session });

    await Sprint.findByIdAndUpdate(
      sprintId,
      { $push: { userStories: savedStory._id } },
      { session }
    );

    await session.commitTransaction();

    return {
      success: true,
      message: "User story created successfully",
      data: {
        userStoryId: savedStory._id,
        storyName: savedStory.storyName,
        description: savedStory.description,
        priority: savedStory.priority,
        storyPointEstimate: savedStory.storyPointEstimate,
        startDate: savedStory.startDate,
        dueDate: savedStory.dueDate,
        sprintId: savedStory.sprintId,
        createdAt: savedStory.createdAt
      }
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// get User Stories for student's project
export const getUserStories = async (projectId) => {
  try {
    if (!projectId) {
      return {
        success: false,
        message: "No project assigned to your account",
        data: []
      };
    }

    const project = await Project.findOne({ _id: projectId, deletedAt: null }).populate({
      path: 'sprints',
      match: { deletedAt: null },
      select: '_id title orderIndex'
    });

    if (!project) {
      return {
        success: false,
        message: "Project not found",
        data: []
      };
    }

    const sprintIds = project.sprints.map(s => s._id);

    if (sprintIds.length === 0) {
      return {
        success: true,
        message: "No sprints found for this project",
        data: []
      };
    }

    const userStories = await UserStory.find({
      sprintId: { $in: sprintIds },
      deletedAt: null
    })
      .populate({
        path: 'sprintId',
        select: 'title'
      })
      .sort({ startDate: 1 });

    return {
      success: true,
      message: "User stories retrieved successfully",
      data: userStories
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: []
    };
  }
};

// get User Stories related to sprint
export const getUserStoriesRelatedToSprint = async (projectId, sprintId) => {
  if (!projectId) {
    const error = new Error("No project assigned to your account");
    error.statusCode = 404;
    throw error;
  }

  const sprint = await Sprint.findById(sprintId);

  if (!sprint || sprint.deletedAt) {
    const error = new Error("Sprint not found or deleted");
    error.statusCode = 404;
    throw error;
  }

  if (String(sprint.projectId) !== String(projectId)) {
    const error = new Error("Sprint does not belong to your project");
    error.statusCode = 403;
    throw error;
  }

  const userStories = await UserStory.find({
    sprintId: sprintId,
    deletedAt: null
  })
    .select([
      "storyName",
      "description",
      "priority",
      "storyPointEstimate",
      "startDate",
      "dueDate",
      "tasks"
    ])
    .sort({ createdAt: 1 })
    .lean();

  return {
    success: true,
    message: "User stories retrieved successfully",
    data: {
      sprint: {
        _id: sprintId,
        title: sprint.title,
        goal: sprint.goal,
        startDate: sprint.startDate,
        endDate: sprint.endDate
      },
      userStories
    }
  };
};

// get US by ID
export const getUserStoryByID = async (userStoryId, projectId) => {
  if (!projectId) {
    const error = new Error("No project assigned to your account");
    error.statusCode = 404;
    throw error;
  }

  const userStory = await UserStory.findOne({
    _id: userStoryId,
    deletedAt: null
  }).lean();

  if (!userStory) {
    const error = new Error("User Story not found or deleted");
    error.statusCode = 404;
    throw error;
  }

  const sprint = await Sprint.findById(userStory.sprintId).lean();
  if (!sprint || sprint.deletedAt) {
    const error = new Error("Sprint not found or deleted");
    error.statusCode = 404;
    throw error;
  }

  if (String(sprint.projectId) !== String(projectId)) {
    const error = new Error("Sprint does not belong to your project");
    error.statusCode = 403;
    throw error;
  }

  return {
    success: true,
    message: "User Story retrieved successfully",
    data: userStory
  };
};

// UPDATE USER STORY
export const updateUserStory = async (userStoryId, updateData, studentId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      storyName,
      description,
      priority,
      storyPointEstimate,
      startDate,
      dueDate,
      sprintId
    } = updateData;

    const userStory = await UserStory.findOne({
      _id: userStoryId,
      deletedAt: null
    }).session(session);

    if (!userStory) {
      const error = new Error("User story not found or deleted");
      error.statusCode = 404;
      throw error;
    }

    const student = await Student.findById(studentId).session(session);

    if (!student) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }

    if (!student.project) {
      const error = new Error("Student has no assigned project");
      error.statusCode = 400;
      throw error;
    }

    const currentSprint = await Sprint.findOne({
      _id: userStory.sprintId,
      deletedAt: null
    }).session(session);

    if (!currentSprint) {
      const error = new Error("Current sprint not found");
      error.statusCode = 404;
      throw error;
    }

    if (String(currentSprint.projectId) !== String(student.project)) {
      const error = new Error("User story does not belong to your project");
      error.statusCode = 403;
      throw error;
    }

    let newSprint = null;
    const isSprintChanging = sprintId && String(sprintId) !== String(userStory.sprintId);

    if (isSprintChanging) {
      newSprint = await Sprint.findOne({
        _id: sprintId,
        deletedAt: null
      }).session(session);

      if (!newSprint) {
        const error = new Error("New sprint not found or deleted");
        error.statusCode = 404;
        throw error;
      }

      if (String(newSprint.projectId) !== String(student.project)) {
        const error = new Error("New sprint does not belong to your project");
        error.statusCode = 403;
        throw error;
      }
    }

    const finalStoryName = storyName || userStory.storyName;
    const finalSprintId = sprintId || userStory.sprintId;

    if (
      (storyName && storyName !== userStory.storyName) ||
      isSprintChanging
    ) {
      const existingUserStory = await UserStory.findOne({
        _id: { $ne: userStoryId },
        storyName: finalStoryName,
        sprintId: finalSprintId,
        deletedAt: null
      }).session(session);

      if (existingUserStory) {
        const error = new Error(
          "A user story with this name already exists in this sprint"
        );
        error.statusCode = 409;
        throw error;
      }
    }

    const finalStartDate = startDate ? new Date(startDate) : userStory.startDate;
    const finalDueDate = dueDate ? new Date(dueDate) : userStory.dueDate;

    if (finalDueDate <= finalStartDate) {
      const error = new Error("Due date must be after start date");
      error.statusCode = 400;
      throw error;
    }

    const updateFields = {};

    if (storyName !== undefined) updateFields.storyName = storyName;
    if (description !== undefined) updateFields.description = description;
    if (priority !== undefined) updateFields.priority = priority;
    if (storyPointEstimate !== undefined) updateFields.storyPointEstimate = storyPointEstimate;
    if (startDate !== undefined) updateFields.startDate = finalStartDate;
    if (dueDate !== undefined) updateFields.dueDate = finalDueDate;
    if (sprintId !== undefined) updateFields.sprintId = sprintId;

    const updatedUserStory = await UserStory.findByIdAndUpdate(
      userStoryId,
      { $set: updateFields },
      { new: true, session, runValidators: true }
    );

    if (isSprintChanging) {
      await Sprint.findByIdAndUpdate(
        userStory.sprintId,
        { $pull: { userStories: userStoryId } },
        { session }
      );

      await Sprint.findByIdAndUpdate(
        sprintId,
        { $push: { userStories: userStoryId } },
        { session }
      );
    }

    await session.commitTransaction();

    return {
      success: true,
      message: "User story updated successfully",
      data: {
        userStoryId: updatedUserStory._id,
        storyName: updatedUserStory.storyName,
        description: updatedUserStory.description,
        priority: updatedUserStory.priority,
        storyPointEstimate: updatedUserStory.storyPointEstimate,
        startDate: updatedUserStory.startDate,
        dueDate: updatedUserStory.dueDate,
        sprintId: updatedUserStory.sprintId,
        updatedAt: updatedUserStory.updatedAt
      }
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// DELETE USER STORY (soft delete)
export const deleteUserStory = async (userStoryId, studentId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userStory = await UserStory.findOne({
      _id: userStoryId,
      deletedAt: null
    }).session(session);

    if (!userStory) {
      const error = new Error("User story not found or already deleted");
      error.statusCode = 404;
      throw error;
    }

    const student = await Student.findById(studentId).session(session);

    if (!student) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }

    if (!student.project) {
      const error = new Error("Student has no assigned project");
      error.statusCode = 400;
      throw error;
    }

    const sprint = await Sprint.findOne({
      _id: userStory.sprintId,
      deletedAt: null
    }).session(session);

    if (!sprint) {
      const error = new Error("Sprint not found");
      error.statusCode = 404;
      throw error;
    }

    if (String(sprint.projectId) !== String(student.project)) {
      const error = new Error("User story does not belong to your project");
      error.statusCode = 403;
      throw error;
    }

    const taskIds = userStory.tasks;

    const deletedTasksResult = await Task.deleteMany(
      { _id: { $in: taskIds } },
      { session }
    );

    await UserStory.findByIdAndUpdate(
      userStoryId,
      { $set: { tasks: [] } },
      { session }
    );

    const deletedUserStory = await UserStory.findByIdAndUpdate(
      userStoryId,
      { $set: { deletedAt: new Date() } },
      { new: true, session }
    );

    await Sprint.findByIdAndUpdate(
      userStory.sprintId,
      { $pull: { userStories: userStoryId } },
      { session }
    );

    await session.commitTransaction();

    return {
      success: true,
      message: "User story and associated tasks deleted successfully",
      data: {
        userStoryId: deletedUserStory._id,
        storyName: deletedUserStory.storyName,
        deletedTasksCount: deletedTasksResult.deletedCount,
        deletedAt: deletedUserStory.deletedAt
      }
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};