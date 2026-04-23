import * as taskService from "../services/task.service.js";
import { projectFacade } from "../../facades/index.js";
import CompSupervisor from "../../Authentication/models/compSupervisor.model.js";
import UniSupervisor from "../../Authentication/models/uniSupervisor.model.js";

export const createTask = async (req, res) => {
  try {
    const { title, userStoryId, status } = req.body;

    if (!title || !userStoryId || !status) {
      return res.status(400).json({ message: "Title, userStoryId, and status are required." });
    }

    const task = await projectFacade.assignTask(userStoryId, req.body);
    res.status(201).json({ message: "Task created successfully", task });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getAllTasks = async (req, res) => {
  try {
    const tasks = await taskService.getAllTasks();
    res.status(200).json({ message: "Tasks retrieved successfully", tasks });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Task ID is required." });
    }

    const task = await taskService.getTaskById(id);
    res.status(200).json({ message: "Task retrieved successfully", task });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
/*
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Task ID is required." });
    }

    const task = await taskService.updateTask(id, req.body);
    res.status(200).json({ message: "Task updated successfully", task });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
*/
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Task ID is required." });
    }

    const result = await taskService.deleteTask(id);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
export const getAllTasksForCompSupervisor = async (req, res) => {
  try {
    const { compSupervisorId } = req.params;
    if (!compSupervisorId) {
      return res.status(400).json({ message: "Supervisor ID is required." });
    }

    // Check if the supervisor is a company supervisor
    let supervisor = await CompSupervisor.findById(compSupervisorId);
    let supervisorType = "Company Supervisor";
    if (!supervisor) {
      // If not found, check if the supervisor is a university supervisor
      supervisor = await UniSupervisor.findById(compSupervisorId);
      supervisorType = "University Supervisor";

      if (!supervisor) {
        return res.status(404).json({ message: "Supervisor not found." });
      }
    }
    // Fetch tasks for the supervisor
    const tasks = await taskService.getAllTasksForCompSupvisor(compSupervisorId);
    res.status(200).json({ message: `${supervisorType} tasks retrieved successfully`, tasks });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
export const getAllTasksForUnivSupervisor = async (req, res) => {
  try {
    const { univSupervisorId } = req.params;
    if (!univSupervisorId) {
      return res.status(400).json({ message: "Supervisor ID is required." });
    }

    // Check if the supervisor is a university supervisor
    let supervisor = await UniSupervisor.findById(univSupervisorId);
    let supervisorType = "University Supervisor";
    if (!supervisor) {
      // If not found, check if the supervisor is a university supervisor
      supervisor = await CompSupervisor.findById(univSupervisorId);
      supervisorType = "Company Supervisor";

      if (!supervisor) {
        return res.status(404).json({ message: "Supervisor not found." });
      }
    }
    // Fetch tasks for the supervisor
    const tasks = await taskService.getAllTasksForUnivSupervisor(univSupervisorId);
    res.status(200).json({ message: `${supervisorType} tasks retrieved successfully`, tasks });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

//controller for getAllTasksForUserStory  
export const getAllTasksForUserStory = async (req, res) => {
  try {
    const { userStoryId } = req.params;
    if (!userStoryId) {
      return res.status(400).json({ message: "User story ID is required." });
    }

    const tasks = await taskService.getAllTasksForUserStory(userStoryId);
    res.status(200).json({ message: "Tasks retrieved successfully", tasks });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
//controller for updateTaskStatus
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Task ID is required." });
    }
    const task = await projectFacade.validateTask(id, req.body, req.user.id);
    res.status(200).json({ message: "Task updated successfully and waiting for validation", task });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

//controller for validateTaskStatus
export const validateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Task ID is required." });
    }

    const validatorRole = req.user.role; // "CompSupervisor" | "UniSupervisor"
    const task = await taskService.validateTaskStatus(id, req.body, validatorRole);
    res.status(200).json({ message: "Task validated successfully", task });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

//controller for makeFullReport
export const makeFullReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required." });
    }
    const report = await taskService.makeFullReport(projectId);
    res.status(200).json({ message: "Report generated successfully", report });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
//controller for getSprintReport
export const getSprintReport = async (req, res) => {
  try {
    const { sprintId } = req.params;
    if (!sprintId) {
      return res.status(400).json({ message: "Sprint ID is required." });
    }
    const report = await taskService.makeSprintReport(sprintId);
    res.status(200).json({ message: "Report generated successfully", report });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
