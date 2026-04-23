import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import Sprint from "../models/sprint.model.js";
import Project from "../models/project.model.js";
import { ProjectFactory } from "../../../factories/ProjectFactory.js";

export const createSprint = async (sprintData, studentId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { title, goal, startDate, endDate } = sprintData;

    // 1. Fetch the student's project (using the studentId from auth middleware which we know has the project ID)
    // However, we need to fetch the Project document to validate dates and ownership.
    // We can find the project where this student is a contributor.
    const project = await Project.findOne({
      contributors: studentId,
      deletedAt: null
    }).session(session);

    if (!project) {
      const error = new Error("Project not found or you are not a contributor");
      error.status = StatusCodes.NOT_FOUND;
      throw error;
    }

    // 2-3-4. Factory Method pattern (GoF p.107)
    const newSprint = ProjectFactory.createSprint({
      title,
      goal,
      startDate,
      endDate,
      project,
    });

    const savedSprint = await newSprint.save({ session });

    // 5. Add Sprint to Project
    project.sprints.push(savedSprint._id);
    await project.save({ session });

    await session.commitTransaction();

    return {
      success: true,
      message: "Sprint created successfully",
      data: savedSprint
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const updateSprint = async (sprintId, updateData, studentId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find the sprint and verify ownership via Project
    const sprint = await Sprint.findOne({
      _id: sprintId,
      deletedAt: null
    }).session(session);

    if (!sprint) {
      const error = new Error("Sprint not found");
      error.status = StatusCodes.NOT_FOUND;
      throw error;
    }

    // Verify student belongs to the project of this sprint
    const project = await Project.findOne({
      _id: sprint.projectId,
      contributors: studentId,
      deletedAt: null
    }).session(session);

    if (!project) {
      const error = new Error("You are not authorized to update this sprint");
      error.status = StatusCodes.FORBIDDEN;
      throw error;
    }

    // 2. Validate Dates if provided
    if (updateData.startDate || updateData.endDate) {
      const newStart = updateData.startDate ? new Date(updateData.startDate) : sprint.startDate;
      const newEnd = updateData.endDate ? new Date(updateData.endDate) : sprint.endDate;
      const projectStart = new Date(project.startDate);
      const projectEnd = new Date(project.endDate);

      if (newStart < projectStart || newEnd > projectEnd) {
        const error = new Error("Sprint dates must be within the project duration");
        error.status = StatusCodes.BAD_REQUEST;
        throw error;
      }

      // Also validate start < end if both or one is changing (handled by Joi mostly, but good to double check logic)
      if (newEnd <= newStart) {
        const error = new Error("End date must be after start date");
        error.status = StatusCodes.BAD_REQUEST;
        throw error;
      }
    }

    // 3. Update Sprint
    // Explicitly update only allowed fields (title, goal, startDate, endDate)
    // orderIndex is updated via reorderSprints
    if (updateData.title) sprint.title = updateData.title;
    if (updateData.goal) sprint.goal = updateData.goal;
    if (updateData.startDate) sprint.startDate = updateData.startDate;
    if (updateData.endDate) sprint.endDate = updateData.endDate;

    const updatedSprint = await sprint.save({ session });

    await session.commitTransaction();

    return {
      success: true,
      message: "Sprint updated successfully",
      data: updatedSprint
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const deleteSprint = async (sprintId, studentId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find Sprint
    const sprint = await Sprint.findOne({ _id: sprintId, deletedAt: null }).session(session);
    if (!sprint) {
      const error = new Error("Sprint not found");
      error.status = StatusCodes.NOT_FOUND;
      throw error;
    }

    // 2. Verify Authorization
    const project = await Project.findOne({
      _id: sprint.projectId,
      contributors: studentId,
      deletedAt: null
    }).session(session);

    if (!project) {
      const error = new Error("You are not authorized to delete this sprint");
      error.status = StatusCodes.FORBIDDEN;
      throw error;
    }

    // 3. Soft Delete Sprint
    sprint.deletedAt = new Date();
    await sprint.save({ session });

    // 4. Remove Sprint reference from Project (Optional: keep it for history, or remove it. 
    // Usually for soft delete we might keep the reference but filter it out. 
    // However, to keep the project document clean, we can pull it. 
    // Given the Project model has `sprints` array, let's keep it consistent with "active" sprints or just leave it.
    // If we pull it, we lose the history in the project structure easily. 
    // Let's NOT pull it, but rely on the Sprint's deletedAt flag.)

    // But wait, if we don't pull it, `project.sprints` will contain deleted sprints. 
    // If the frontend fetches project with populated sprints, it needs to filter.
    // Let's stick to just marking the sprint as deleted.
    project.sprints.pull(sprint._id);
    await project.save({ session });

    await session.commitTransaction();

    return {
      success: true,
      message: "Sprint deleted successfully"
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const reorderSprints = async (sprintsOrder, studentId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate that all sprints belong to the same project and the student is authorized
    // We'll pick the first sprint to find the project, then verify all others.
    if (!sprintsOrder || sprintsOrder.length === 0) {
      return { success: true, message: "No sprints to reorder" };
    }

    const firstSprintId = sprintsOrder[0].sprintId;
    const firstSprint = await Sprint.findOne({ _id: firstSprintId, deletedAt: null }).session(session);

    if (!firstSprint) {
      const error = new Error(`Sprint ${firstSprintId} not found`);
      error.status = StatusCodes.NOT_FOUND;
      throw error;
    }

    const projectId = firstSprint.projectId;

    // Verify student authorization for this project
    const project = await Project.findOne({
      _id: projectId,
      contributors: studentId,
      deletedAt: null
    }).session(session);

    if (!project) {
      const error = new Error("You are not authorized to reorder sprints for this project");
      error.status = StatusCodes.FORBIDDEN;
      throw error;
    }

    // 2. Update each sprint
    // We need to ensure all sprintIds provided belong to this project
    const updatePromises = sprintsOrder.map(async (item) => {
      const sprint = await Sprint.findOne({
        _id: item.sprintId,
        projectId: projectId, // Security check: must belong to same project
        deletedAt: null
      }).session(session);

      if (!sprint) {
        throw new Error(`Sprint ${item.sprintId} not found or does not belong to the project`);
      }

      sprint.orderIndex = item.orderIndex;
      return sprint.save({ session });
    });

    await Promise.all(updatePromises);

    // 3. Verify that sprintsOrder length matches project sprints length
    if (sprintsOrder.length !== project.sprints.length) {
      const error = new Error(`Number of sprints to reorder (${sprintsOrder.length}) does not match project sprints count (${project.sprints.length})`);
      error.status = StatusCodes.BAD_REQUEST;
      throw error;
    }

    await session.commitTransaction();

    return {
      success: true,
      message: "Sprints reordered successfully"
    };

  } catch (error) {
    await session.abortTransaction();
    // If it's one of our custom errors, rethrow. If it's a promise error, wrap it.
    if (!error.status) error.status = StatusCodes.BAD_REQUEST;
    throw error;
  } finally {
    session.endSession();
  }
};
