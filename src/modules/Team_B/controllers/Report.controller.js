import { projectFacade } from "../../facades/index.js";
import * as reportService from "../services/Report.service.js";
import { StatusCodes } from "http-status-codes";

// CREATE REPORT
export const createReport = async (req, res, next) => {
  try {
    const studentId = req.student.id;
    
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "File is required",
      });
    }

    const result = await projectFacade.generateReport(undefined, req.validatedBody, studentId, req.file);

    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

// UPDATE REPORT
export const updateReport = async (req, res, next) => {
  try {
    const studentId = req.student.id;
    const reportId = req.params.id;
    const data = req.validatedBody;
    const result = await reportService.updateReport(
      studentId,
      reportId,
      data
    );

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};


// GET Reports of student project ALL for student
export const getAllReports = async (req, res, next) => {
  try {
    const studentId = req.student.id;
    const result = await reportService.getAllReports(studentId);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

// GET BY ID for student 
export const getReportById = async (req, res, next) => {
  try {
    const studentId = req.student.id;
    const reportId = req.params.id;

    const result = await reportService.getReportById(studentId, reportId);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

// GET ALL REPORTS FOR SUPERVISOR BY PROJECT ID
export const getAllReportCompanySupervisor = async (req, res, next) => {
  try {
    const supervisorId = req.supervisor.id;
    const projectId = req.params.projectID;

    const result = await reportService.getAllReportsForCompanySupervisor(
      supervisorId,
      projectId
    );

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};


// GET ALL REPORTS FOR UNI SUPERVISOR BY PROJECT ID
export const getAllReportsUniSupervisor = async (req, res, next) => {
  try {
    const supervisorId = req.supervisor.id;
    const projectId = req.params.projectID;

    const result = await reportService.getAllReportsForUniSupervisor(
      supervisorId,
      projectId
    );

    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

// DELETE report
export const deleteReport = async (req, res, next) => {
  try {
    const studentId = req.student.id;
    const reportId = req.params.id;

    const result = await reportService.deleteReport(studentId, reportId);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};
