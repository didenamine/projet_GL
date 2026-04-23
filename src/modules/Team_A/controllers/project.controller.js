import { projectFacade } from "../../facades/index.js";
import * as projectService from "../services/project.service.js";
import { StatusCodes } from "http-status-codes";

export const createProject = async (req, res, next) => {
  try {
    const projectData = req.validatedBody;
    const studentId = req.student.id;
    
    const result = await projectFacade.bootstrapProject(projectData, studentId);
    
    res.status(StatusCodes.CREATED).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const projectId = req.student.project;
    
    if (!projectId) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "No project assigned to your account"
      });
    }
    
    const result = await projectService.getProject(projectId);
    
    res.status(StatusCodes.OK).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const projectId = req.student.project;
    const updateData = req.validatedBody;
    
    if (!projectId) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "No project assigned to your account"
      });
    }

    const result = await projectService.updateProject(projectId, updateData);
    
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const projectId = req.student.project;
    
    if (!projectId) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "No project assigned to your account"
      });
    }

    const result = await projectService.deleteProject(projectId);
    
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const getStudentsWithoutProject = async (req, res, next) => {
  try {
    const result = await projectService.getStudentsWithoutProject();
    res.status(StatusCodes.OK).json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

export const addContributors = async (req, res, next) => {
  try {
    const { projectId, studentIds } = req.body;
    const requestingStudentId = req.student.id;

    if (!projectId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Valid project ID is required"
      });
    }
  
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Non-empty student IDs array is required"
      });
    }

    const result = await projectService.addContributors({ projectId, studentIds, requestingStudentId });
    res.status(StatusCodes.OK).json({
      success: result.success,
      message: result.message,
      invalidStudents: result.invalidStudents
    });
  } catch (error) {
    next(error);
  }
};

export const removeContributors = async (req, res, next) => {
  try {
    const { projectId, studentIds } = req.body;
    const requestingStudentId = req.student.id;

    if (!projectId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Valid project ID is required"
      });
    }
  
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Non-empty student IDs array is required"
      });
    }
    
    const result = await projectService.removeContributors({ projectId, studentIds, requestingStudentId });
    res.status(StatusCodes.OK).json({
      success: result.success,
      message: result.message,
      invalidStudents: result.invalidStudents
    });
  } catch (error) {
    next(error);
  }
};