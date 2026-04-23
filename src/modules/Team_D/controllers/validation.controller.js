// controllers/validation.controller.js
import * as validationService from "../services/validation.service.js";
import { StatusCodes } from "http-status-codes";

export const createValidation = async (req, res, next) => {
  try {
    const validatorId = req.supervisor.id; // Enc_Company / Enc_University
    const validatorRole = req.user.role; // "CompSupervisor" | "UniSupervisor"
    const data = req.body;

    const result = await validationService.createValidation(data, validatorId, validatorRole);

    if (!result.success) {
      return res.status(result.code).json({
        success: false,
        message: result.message
      });
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

export const getValidationsByTask = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;

    const result = await validationService.getValidationsByTask(taskId);

    if (!result.success) {
      return res.status(result.code).json({
        success: false,
        message: result.message
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

export const deleteValidation = async (req, res, next) => {
  try {
    const validationId = req.params.id;
    const validatorId = req.supervisor.id;

    const result = await validationService.deleteValidation(validationId, validatorId);

    if (!result.success) {
      return res.status(result.code).json({
        success: false,
        message: result.message
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
