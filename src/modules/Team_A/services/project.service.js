import mongoose from "mongoose";
import Project from "../models/project.model.js";
import Student from "../../Authentication/models/student.model.js";
import { projectCreator } from "../../../factories/ProjectCreator.js";

export const createProject = async (projectData, studentId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { title, description, startDate, endDate, contributors = [] } = projectData;

    const student = await Student.findById(studentId).session(session);
    
    if (!student) {
      const error = new Error("Student not found");
      error.status = 404;
      throw error;
    }

    if (student.project) {
      const existingProject = await Project.findById(student.project).session(session);
      if (existingProject && !existingProject.deletedAt) {
        const error = new Error("Student already has an active project");
        error.status = 409;
        throw error;
      }
    }

    const uniqueContributors = [...new Set(
      contributors
        .map(id => id.toString())
        .filter(id => id !== studentId.toString())
    )];

    let validatedContributors = [];
    if (uniqueContributors.length > 0) {
      const contributorStudents = await Student.find({
        _id: { $in: uniqueContributors }
      }).session(session);

      if (contributorStudents.length !== uniqueContributors.length) {
        const error = new Error("One or more contributors not found");
        error.status = 404;
        throw error;
      }

      for (const contributorStudent of contributorStudents) {
        if (contributorStudent.project) {
          const existingProject = await Project.findById(contributorStudent.project).session(session);
          if (existingProject && !existingProject.deletedAt) {
            const error = new Error(`Contributor ${contributorStudent.cin} already has an active project`);
            error.status = 409;
            throw error;
          }
        }
      }

      validatedContributors = uniqueContributors;
    }

    // ── GRASP Creator + Factory Method : création et validation déléguées au ProjectCreator ──
    const newProject = projectCreator.create({
      title,
      description,
      startDate,
      endDate,
      contributors: [studentId, ...validatedContributors],
    });
    // ──────────────────────────────────────────────────────────────────────────────────────────

    const savedProject = await newProject.save({ session });

    await Student.findByIdAndUpdate(
      studentId,
      { project: savedProject._id },
      { session }
    );

    if (validatedContributors.length > 0) {
      await Student.updateMany(
        { _id: { $in: validatedContributors } },
        { project: savedProject._id },
        { session }
      );
    }

    await session.commitTransaction();

    return {
      success: true,
      message: "Project created successfully",
      data: {
        projectId: savedProject._id,
        title: savedProject.title,
        description: savedProject.description,
        startDate: savedProject.startDate,
        endDate: savedProject.endDate,
        contributors: savedProject.contributors,
        createdAt: savedProject.createdAt
      }
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getProject = async (projectId) => {
  const project = await Project.aggregate([
    {
      $match: {
        _id: projectId,
        deletedAt: null
      }
    },
    {
      $lookup: {
        from: "students",
        localField: "contributors",
        foreignField: "_id",
        as: "contributorsData",
        pipeline: [{
          $match: { deletedAt: null }
        }]
      }
    },
    {
      $unwind: "$contributorsData"
    },
    {
      $lookup: {
        from: "users",
        localField: "contributorsData.userId",
        foreignField: "_id",
        as: "contributorsData.user",
        pipeline: [{
          $match: { 
            isActive: true,
            deletedAt: null 
          }
        }]
      }
    },
    {
      $unwind: "$contributorsData.user"
    },
    {
      $lookup: {
        from: "sprints",
        localField: "sprints",
        foreignField: "_id",
        as: "sprintsData",
        pipeline: [
          { $match: { deletedAt: null } },
          { $sort: { orderIndex: 1 } },
          { 
            $project: { 
              _id: 1,
              title: 1,
              goal: 1,
              startDate: 1,
              endDate: 1,
              orderIndex: 1
            } 
          }
        ]
      }
    },
    {
      $group: {
        _id: "$_id",
        title: { $first: "$title" },
        description: { $first: "$description" },
        startDate: { $first: "$startDate" },
        endDate: { $first: "$endDate" },
        contributors: { 
          $addToSet: {
            _id: "$contributorsData.user._id",
            fullName: "$contributorsData.user.fullName",
            email: "$contributorsData.user.email"
          }
        },
        sprints: { $first: "$sprintsData" }
      }
    },
    {
      $project: {
        _id: 0,
        title: 1,
        description: { $ifNull: ["$description", ""] },
        startDate: 1,
        endDate: 1,
        contributors: 1,
        sprints: 1
      }
    }
  ]).exec();

  if (!project.length) {
    const error = new Error("Project not found or access denied");
    error.status = 404;
    throw error;
  }

  const result = project[0];

  return {
    success: true,
    message: "Project retrieved successfully",
    data: { 
      title: result.title,
      description: result.description,
      startDate: result.startDate.toISOString(),
      endDate: result.endDate.toISOString(),
      contributors: result.contributors.map(c => ({
        _id: c._id.toString(),
        fullName: c.fullName,
        email: c.email
      })),
      sprints: result.sprints.map(s => ({
        _id: s._id.toString(),
        title: s.title,
        goal: s.goal,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
        orderIndex: s.orderIndex
      }))
    }
  };
};

export const updateProject = async (projectId, updateData) => {
  const { title, description, startDate, endDate } = updateData;
  
  const project = await Project.findOne({ _id: projectId, deletedAt: null });
  if (!project) {
    const error = new Error("Project not found");
    error.status = 404;
    throw error;
  }

  const newStart = startDate ? new Date(startDate) : project.startDate;
  const newEnd = endDate ? new Date(endDate) : project.endDate;

  if (newEnd <= newStart) {
    const error = new Error("End date must be after start date");
    error.status = 400;
    throw error;
  }

  if (title) project.title = title;
  if (description !== undefined) project.description = description;
  if (startDate) project.startDate = startDate;
  if (endDate) project.endDate = endDate;

  await project.save();

  return {
    success: true,
    message: "Project updated successfully",
    data: project
  };
};

export const deleteProject = async (projectId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const project = await Project.findOne({ _id: projectId, deletedAt: null }).session(session);
    
    if (!project) {
      const error = new Error("Project not found");
      error.status = 404;
      throw error;
    }

    project.deletedAt = new Date();
    await project.save({ session });

    if (project.contributors && project.contributors.length > 0) {
      await Student.updateMany(
        { _id: { $in: project.contributors } },
        { $unset: { project: 1 } }
      ).session(session);
    }

    await session.commitTransaction();
    
    return {
      success: true,
      message: "Project deleted successfully"
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getStudentsWithoutProject = async () => {
  const studentsWithProjects = await Project.distinct("contributors", { 
    deletedAt: null 
  });

  const studentsWithoutProject = await Student.aggregate([
    {
      $match: {
        _id: { $nin: studentsWithProjects },
        deletedAt: null
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    },
    {
      $match: {
        "user.isActive": true,
        "user.deletedAt": null,
        "user.role": "Student"
      }
    },
    {
      $project: {
        _id: 1,
        fullName: "$user.fullName"
      }
    },
    {
      $sort: { fullName: 1 }
    }
  ]);

  return {
    success: true,
    message: "Students without project retrieved successfully",
    data: studentsWithoutProject
  };
};

export const addContributors = async ({ projectId, studentIds, requestingStudentId }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const project = await Project.findOne({
      _id: projectId,
      deletedAt: null,
      contributors: requestingStudentId
    }).session(session);

    if (!project) {
      const error = new Error("Project not found or access denied");
      error.status = 404;
      throw error;
    }

    const validStudents = await Student.aggregate([
      {
        $match: {
          _id: { $in: studentIds.map(id => new mongoose.Types.ObjectId(id)) },
          project: { $exists: false },
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $match: { isActive: true, deletedAt: null } }]
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          userId: 1
        }
      }
    ]).session(session);

    const validStudentIds = validStudents.map(s => s._id.toString());
    const invalidStudents = studentIds.filter(id => !validStudentIds.includes(id));

    if (validStudentIds.length > 0) {
      await Project.updateOne(
        { _id: projectId },
        { $addToSet: { contributors: { $each: validStudentIds } } }
      ).session(session);

      await Student.updateMany(
        { _id: { $in: validStudentIds } },
        { $set: { project: projectId } }
      ).session(session);
    }

    await session.commitTransaction();
    return {
      success: true,
      message: `Successfully added ${validStudentIds.length} contributors`,
      invalidStudents
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const removeContributors = async ({ projectId, studentIds, requestingStudentId }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const project = await Project.findOne({
      _id: projectId,
      deletedAt: null,
      contributors: requestingStudentId
    })
    .select('contributors')
    .session(session);

    if (!project) {
      const error = new Error("Project not found or access denied");
      error.status = 404;
      throw error;
    }

    const requestingStudentIdStr = requestingStudentId.toString();
    if (studentIds.includes(requestingStudentIdStr)) {
      const error = new Error("You cannot remove yourself from the project");
      error.status = 409;
      throw error;
    }

    const projectObjectId = new mongoose.Types.ObjectId(projectId);
    const validStudents = await Student.aggregate([
      {
        $match: {
          _id: { $in: studentIds.map(id => new mongoose.Types.ObjectId(id)) },
          project: projectObjectId,
          deletedAt: null
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $match: { isActive: true, deletedAt: null } }]
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1
        }
      }
    ]).session(session);

    const validStudentIds = validStudents.map(s => s._id.toString());
    const invalidStudents = studentIds.filter(id => !validStudentIds.includes(id));

    if (validStudentIds.length > 0) {
      const projectUpdate = await Project.updateOne(
        { 
          _id: projectId,
          contributors: { $all: validStudentIds }
        },
        { $pull: { contributors: { $in: validStudentIds } } }
      ).session(session);

      if (projectUpdate.modifiedCount === 0) {
        throw new Error("Concurrent modification detected - retry operation");
      }

      await Student.updateMany(
        { _id: { $in: validStudentIds } },
        { $unset: { project: "" } }
      ).session(session);
    }

    await session.commitTransaction();
    return {
      success: true,
      message: `Successfully removed ${validStudentIds.length} contributors`,
      invalidStudents
    };
  } catch (error) {
    await session.abortTransaction();
    
    if (error.message.includes("Concurrent modification")) {
      const conflictError = new Error("Project modified by another user. Please refresh and retry.");
      conflictError.status = 409;
      throw conflictError;
    }
    throw error;
  } finally {
    session.endSession();
  }
};