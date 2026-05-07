import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import Sprint from "../models/sprint.model.js";
import Project from "../models/project.model.js";
import { sprintCreator } from "../../../factories/SprintCreator.js";

export const createSprint = async (sprintData, studentId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { title, goal, startDate, endDate } = sprintData;

    const project = await Project.findOne({
      contributors: studentId,
      deletedAt: null
    }).session(session);

    if (!project) {
      const error = new Error("Project not found or you are not a contributor");
      error.status = StatusCodes.NOT_FOUND;
      throw error;
    }

    // ── GRASP Creator + Factory Method : création et validation déléguées au SprintCreator ──
    const newSprint = sprintCreator.create({
      title,
      goal,
      startDate,
      endDate,
      project,
    });
    // ──────────────────────────────────────────────────────────────────────────────────────────

    const savedSprint = await newSprint.save({ session });

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
    const sprint = await Sprint.findOne({
      _id: sprintId,
      deletedAt: null
    }).session(session);

    if (!sprint) {
      const error = new Error("Sprint not found");
      error.status = StatusCodes.NOT_FOUND;
      throw error;
    }

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

      if (newEnd <= newStart) {
        const error = new Error("End date must be after start date");
        error.status = StatusCodes.BAD_REQUEST;
        throw error;
      }
    }

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
    const sprint = await Sprint.findOne({ _id: sprintId, deletedAt: null }).session(session);
    if (!sprint) {
      const error = new Error("Sprint not found");
      error.status = StatusCodes.NOT_FOUND;
      throw error;
    }

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

    sprint.deletedAt = new Date();
    await sprint.save({ session });

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

    const updatePromises = sprintsOrder.map(async (item) => {
      const sprint = await Sprint.findOne({
        _id: item.sprintId,
        projectId: projectId,
        deletedAt: null
      }).session(session);

      if (!sprint) {
        throw new Error(`Sprint ${item.sprintId} not found or does not belong to the project`);
      }

      sprint.orderIndex = item.orderIndex;
      return sprint.save({ session });
    });

    await Promise.all(updatePromises);

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
    if (!error.status) error.status = StatusCodes.BAD_REQUEST;
    throw error;
  } finally {
    session.endSession();
  }
};