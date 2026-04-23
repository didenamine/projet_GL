import mongoose from "mongoose";
import Report from "../models/report.model.js";
import Student from "../../Authentication/models/student.model.js"; 
import Project from "../../Team_A/models/project.model.js"; 
import CompSupervisor from "../../Authentication/models/compSupervisor.model.js";
import UniSupervisor from "../../Authentication/models/uniSupervisor.model.js";


import fs from "fs";
import path from "path";
import { ProjectFactory } from "../../../factories/ProjectFactory.js";

/** ========================================
 * CREATE REPORT
 * ======================================== */
export const createReport = async (studentId, data, file) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let savedFilePath = null; // Pour cleanup si erreur
  let filePath = null; // Pour la base de données

  try {
    const { versionLabel, notes } = data;

    /** ----------------------------------------------------
     * 1. Validate that the student exists and has a project
     * ---------------------------------------------------- */
    const student = await Student.findById(studentId).session(session);

    if (!student) {
      const error = new Error("Student not found");
      error.statusCode = 404; // ✅ statusCode au lieu de status
      throw error;
    }

    if (!student.project) {
      const error = new Error("Student has no assigned project");
      error.statusCode = 400;
      throw error;
    }

    const projectId = student.project;

    /** ----------------------------------------------------
     * 2. Validate that the project exists
     * ---------------------------------------------------- */
    const project = await Project.findById(projectId).session(session);

    if (!project || project.deletedAt) {
      const error = new Error("Project not found or deleted");
      error.statusCode = 404;
      throw error;
    }

    /** ----------------------------------------------------
     * 3. Check if version label already exists for this project
     * ---------------------------------------------------- */
    const existingReport = await Report.findOne({
      projectId,
      versionLabel,
      deletedAt: null
    }).session(session);

    if (existingReport) {
      const error = new Error(
        `Version ${versionLabel} already exists for this project`
      );
      error.statusCode = 409; // ✅ statusCode
      throw error;
    }

    /** ----------------------------------------------------
     * 4. Generate filename and save file to disk
     * ---------------------------------------------------- */
    const uploadDir = path.join(process.cwd(), "uploads", "reports");
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    const filename = `${Date.now()}_${base}${ext}`;
    const fullPath = path.join(uploadDir, filename);
    filePath = `/uploads/reports/${filename}`; // ✅ Défini ici

    // ✅ Sauvegarde physique du fichier
    fs.writeFileSync(fullPath, file.buffer);
    savedFilePath = fullPath; // Garder pour cleanup

    /** ----------------------------------------------------
     * 5. Create the report — Factory Method pattern (GoF p.107)
     * ---------------------------------------------------- */
    const newReport = ProjectFactory.createReport({
      versionLabel,
      notes,
      filePath,
      projectId,
    });

    const savedReport = await newReport.save({ session });

    /** --------------------------------------------
     * 6. Add Report reference to project
     * -------------------------------------------- */
    await Project.findByIdAndUpdate(
      projectId,
      { $push: { reports: savedReport._id } },
      { session }
    );

    await session.commitTransaction();

    return {
      success: true,
      message: "Report created successfully",
      data: {
        reportId: savedReport._id,
        versionLabel: savedReport.versionLabel,
        notes: savedReport.notes,
        filePath: savedReport.filePath,
        projectId: savedReport.projectId,
        createdAt: savedReport.createdAt,
        updatedAt: savedReport.updatedAt
      }
    };

  } catch (error) {
    await session.abortTransaction();
    
    // Delete uploaded file if transaction fails
    if (savedFilePath && fs.existsSync(savedFilePath)) {
      fs.unlinkSync(savedFilePath);
    }
    
    throw error;
  } finally {
    session.endSession();
  }
};

/** ========================================
 * UPDATE REPORT (only notes can be updated)
 * ======================================== */
export const updateReport = async (studentId, reportId, data) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { notes } = data; // On peut seulement modifier les notes

    /** ----------------------------------------------------
     * 1. Validate student and get project
     * ---------------------------------------------------- */
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

    /** ----------------------------------------------------
     * 2. Validate ObjectId format
     * ---------------------------------------------------- */
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      const error = new Error("Invalid report ID format");
      error.statusCode = 400;
      throw error;
    }

    /** ----------------------------------------------------
     * 3. Get the report
     * ---------------------------------------------------- */
    const report = await Report.findOne({
      _id: reportId,
      deletedAt: null
    }).session(session);

    if (!report) {
      const error = new Error("Report not found or deleted");
      error.statusCode = 404;
      throw error;
    }

    /** ----------------------------------------------------
     * 4. Verify report belongs to student's project
     * ---------------------------------------------------- */
    if (String(report.projectId) !== String(student.project)) {
      const error = new Error("Report does not belong to your project");
      error.statusCode = 403;
      throw error;
    }

    /** ----------------------------------------------------
     * 5. Update the report
     * ---------------------------------------------------- */
    if (notes) report.notes = notes;

    const updatedReport = await report.save({ session });

    await session.commitTransaction();

    return {
      success: true,
      message: "Report updated successfully",
      data: {
        reportId: updatedReport._id,
        versionLabel: updatedReport.versionLabel,
        notes: updatedReport.notes,
        filePath: updatedReport.filePath,
        projectId: updatedReport.projectId,
        updatedAt: updatedReport.updatedAt
      }
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};



/** ========================================
 * GET ALL REPORTS (for student's project)
 * ======================================== */
export const getAllReports = async (studentId) => {
  /** ----------------------------------------------------
   * 1. Validate student and get project
   * ---------------------------------------------------- */
  const student = await Student.findById(studentId);

  if (!student) {
    const error = new Error("Student not found");
    error.statusCode= 404;
    throw error;
  }

  if (!student.project) {
    const error = new Error("Student has no assigned project");
    error.statusCode= 400;
    throw error;
  }

  /** ----------------------------------------------------
   * 2. Get all non-deleted reports for the project
   * ---------------------------------------------------- */
  const reports = await Report.find({
    projectId: student.project,
    deletedAt: null
  })
    .sort({ versionLabel: -1 }) // Most recent version first
    .select("-__v");

  return {
    success: true,
    message: "Reports retrieved successfully",
    count: reports.length,
    data: reports
  };
};

/** ========================================
 * GET REPORT BY ID
 * ======================================== */
export const getReportById = async (studentId, reportId) => {
  /** ----------------------------------------------------
   * 1. Validate student and get project
   * ---------------------------------------------------- */
  const student = await Student.findById(studentId);

  if (!student) {
    const error = new Error("Student not found");
    error.statusCode= 404;
    throw error;
  }

  if (!student.project) {
    const error = new Error("Student has no assigned project");
    error.statusCode= 400;
    throw error;
  }

  /** ----------------------------------------------------
   * 2. Validate ObjectId format
   * ---------------------------------------------------- */
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    const error = new Error("Invalid report ID format");
    error.statusCode= 400;
    throw error;
  }

  /** ----------------------------------------------------
   * 3. Get the report
   * ---------------------------------------------------- */
  const report = await Report.findOne({
    _id: reportId,
    deletedAt: null
  }).select("-__v");

  if (!report) {
    const error = new Error("Report not found or deleted");
    error.statusCode= 404;
    throw error;
  }

  /** ----------------------------------------------------
   * 4. Verify report belongs to student's project
   * ---------------------------------------------------- */
  if (String(report.projectId) !== String(student.project)) {
    const error = new Error("Report does not belong to your project");
    error.statusCode= 403;
    throw error;
  }

  return {
    success: true,
    message: "Report retrieved successfully",
    data: report
  };
};


/** ========================================
 * GET ALL REPORTS FOR Company SUPERVISOR (by projectId)
 * ======================================== */
export const getAllReportsForCompanySupervisor = async (supervisorId, projectId) => {
  /** ----------------------------------------------------
   * 1. Validate projectId format
   * ---------------------------------------------------- */
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    const error = new Error("Invalid project ID format");
    error.statusCode = 400;
    throw error;
  }

  /** ----------------------------------------------------
   * 2. Get supervisor to check students
   * ---------------------------------------------------- */
  const supervisor = await CompSupervisor.findById(supervisorId);

  if (!supervisor) {
    const error = new Error("Supervisor not found");
    error.statusCode = 404;
    throw error;
  }

  /** ----------------------------------------------------
   * 3. Get project and verify it exists
   * ---------------------------------------------------- */
  const project = await Project.findOne({
    _id: projectId,
    deletedAt: null
  });

  if (!project) {
    const error = new Error("Project not found or deleted");
    error.statusCode = 404;
    throw error;
  }

  /** ----------------------------------------------------
   * 4. Verify supervisor has access to this project
   *    (at least one contributor must be supervised by this supervisor)
   * ---------------------------------------------------- */

  
  const students = await Student.find({
    _id: { $in: project.contributors },
    compSupervisorId: supervisor.userId  
  });

  if (students.length === 0) {
    const error = new Error("You don't have access to this project");
    error.statusCode = 403;
    throw error;
  }

  /** ----------------------------------------------------
   * 5. Get all reports for this project
   * ---------------------------------------------------- */
  const reports = await Report.find({
    projectId,
    deletedAt: null
  })
    .sort({ versionLabel: -1 }) // Most recent version first
    .select("-__v");

  return {
    success: true,
    message: "Reports retrieved successfully",
    project: {
      id: project._id,
      title: project.title,
      description: project.description
    },
    count: reports.length,
    data: reports
  };
};

/** ========================================
 * GET ALL REPORTS FOR UNI SUPERVISOR (by projectId)
 * ======================================== */
export const getAllReportsForUniSupervisor = async (supervisorId, projectId) => {
  /** ----------------------------------------------------
   * 1. Validate projectId format
   * ---------------------------------------------------- */
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    const error = new Error("Invalid project ID format");
    error.statusCode = 400;
    throw error;
  }

  /** ----------------------------------------------------
   * 2. Get supervisor to check students
   * ---------------------------------------------------- */
  const supervisor = await UniSupervisor.findById(supervisorId);

  if (!supervisor) {
    const error = new Error("Supervisor not found");
    error.statusCode = 404;
    throw error;
  }

  /** ----------------------------------------------------
   * 3. Get project and verify it exists
   * ---------------------------------------------------- */
  const project = await Project.findOne({
    _id: projectId,
    deletedAt: null
  });

  if (!project) {
    const error = new Error("Project not found or deleted");
    error.statusCode = 404;
    throw error;
  }

  /** ----------------------------------------------------
   * 4. Verify supervisor has access to this project
   *    (at least one contributor must be supervised by this supervisor)
   * ---------------------------------------------------- */
  const students = await Student.find({
    _id: { $in: project.contributors },
    uniSupervisorId: supervisor.userId
  });

  if (students.length === 0) {
    const error = new Error("You don't have access to this project");
    error.statusCode = 403;
    throw error;
  }

  /** ----------------------------------------------------
   * 5. Get all reports for this project
   * ---------------------------------------------------- */
  const reports = await Report.find({
    projectId,
    deletedAt: null
  })
    .sort({ versionLabel: -1 })
    .select("-__v");

  return {
    success: true,
    message: "Reports retrieved successfully",
    project: {
      id: project._id,
      title: project.title,
      description: project.description
    },
    count: reports.length,
    data: reports
  };
};


/** ========================================
 * DELETE REPORT (Soft Delete)
 * ======================================== */
export const deleteReport = async (studentId, reportId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /** ----------------------------------------------------
     * 1. Validate student and get project
     * ---------------------------------------------------- */
    const student = await Student.findById(studentId).session(session);

    if (!student) {
      const error = new Error("Student not found");
      error.statusCode= 404;
      throw error;
    }

    if (!student.project) {
      const error = new Error("Student has no assigned project");
      error.statusCode= 400;
      throw error;
    }
    const projectId = student.project;

    /** ----------------------------------------------------
     * 2. Validate ObjectId format
     * ---------------------------------------------------- */
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      const error = new Error("Invalid report ID format");
      error.statusCode= 400;
      throw error;
    }

    /** ----------------------------------------------------
     * 3. Get the report
     * ---------------------------------------------------- */
    const report = await Report.findOne({
      _id: reportId,
      deletedAt: null
    }).session(session);

    if (!report) {
      const error = new Error("Report not found or already deleted");
      error.statusCode= 404;
      throw error;
    }

    /** ----------------------------------------------------
     * 4. Verify report belongs to student's project
     * ---------------------------------------------------- */
    if (String(report.projectId) !== String(student.project)) {
      const error = new Error("Report does not belong to your project");
      error.statusCode= 403;
      throw error;
    }

    /** ----------------------------------------------------
     * 5. Soft delete the report
     * ---------------------------------------------------- */
    report.deletedAt = new Date();
    await report.save({ session });

    /** ----------------------------------------------------
     * 6. Remove report reference from project
     * ---------------------------------------------------- */
    await Project.findByIdAndUpdate(
      projectId,
      { $pull: { reports: report._id } },
      { session }
    );

    await session.commitTransaction();

    return {
      success: true,
      message: "Report deleted successfully",
      data: {
        reportId: report._id,
        versionLabel: report.versionLabel,
        deletedAt: report.deletedAt
      }
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
