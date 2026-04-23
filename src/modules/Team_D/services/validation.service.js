import Validation from "../models/validation.model.js";
import Task from "../../Team_C/models/task.model.js";
import Meeting from "../models/meeting.model.js";
import mongoose from "mongoose";
import ValidatorFactory from "../../../validators/ValidatorFactory.js";

export const createValidation = async (data, validatorId, validatorRole) => {
  const {
    taskId,
    status,
    meetingType,
    meetingReference,
    comment
  } = data;

  // 1️⃣ Validate required fields
  if (!taskId || !status || !meetingType) {
    return {
      success: false,
      code: 400,
      message: "Missing required fields"
    };
  }
 
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return {
      success: false,
      code: 400,
      message: "Invalid taskId format"
    };
  }

  // 2️⃣ Get validator and check authorization
  const validator = ValidatorFactory.get(validatorRole, validatorId);
  const isAllowed = await validator.validate({
    taskId,
    status,
    meetingType,
    meetingReference
  });

  if (!isAllowed) {
    return {
      success: false,
      code: 403,
      message: "You are not authorized to validate this task"
    };
  }

  // 5️⃣ Create validation entry
  const validation = await Validation.create({
    taskId,
    status,
    validatorId,
    meetingType,
    meetingReference: meetingReference || null,
    comment
  });

  return {
    success: true,
    message: "Validation created successfully",
    data: validation
  };
};


export const getValidationsByTask = async (taskId) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return {
      success: false,
      code: 400,
      message: "Invalid taskId format"
    };
  }
  const task = await Task.findById(taskId);
    if (!task) return { 
      success: false, 
      code: 404,
      message: "Task not found" 
    };

  const validations = await Validation.find({
    taskId,
    deletedAt: null
  }).sort({ createdAt: -1 });

  return {
    success: true,
    message: "Validations fetched successfully",
    data: validations
  };
};


export const deleteValidation = async (id, requestingValidatorId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return {
      success: false,
      code: 400,
      message: "Invalid validation ID"
    };
  }

  const validation = await Validation.findById(id);
  if (!validation || validation.deletedAt !== null) {
    return {
      success: false,
      code: 404,
      message: "Validation not found"
    };
  }

  // 403: Only original validator can delete
  if (validation.validatorId.toString() !== requestingValidatorId.toString()) {
    return {
      success: false,
      code: 403,
      message: "Only the original validator can cancel this validation"
    };
  }

  // Soft delete
  validation.deletedAt = new Date();
  await validation.save();

  return {
    success: true,
    message: "Validation deleted successfully"
  };
};
