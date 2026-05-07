/**
 * GoF Factory Method — Concrete Creator (Création)
 * GRASP Creator — possède toutes les données d'initialisation nécessaires à la création d'une Task
 * SRP — responsabilité unique : instancier et valider une Task Mongoose
 */
import ITaskCreator from "./interfaces/ITaskCreator.js";
import Task from "../modules/Team_C/models/task.model.js";

const VALID_STATUSES   = ["ToDo", "InProgress", "Standby", "Done"];
const VALID_PRIORITIES = ["Low", "Medium", "High"];

export default class TaskCreator extends ITaskCreator {
  /**
   * Factory Method — crée un document Task validé (non sauvegardé).
   *
   * @param {Object}   data
   * @param {string}   data.title
   * @param {string}   [data.description]
   * @param {string}   data.status       – l'un de VALID_STATUSES
   * @param {string}   [data.priority]   – l'un de VALID_PRIORITIES, défaut "Medium"
   * @param {string}   data.userStoryId
   * @param {string}   [data.assignedTo]
   * @returns {import('mongoose').Document}
   */
  create({ title, description = "", status, priority = "Medium", userStoryId, assignedTo }) {
    if (!title?.trim()) {
      const err = new Error("Task title is required");
      err.status = 400;
      throw err;
    }

    if (!userStoryId) {
      const err = new Error("Task userStoryId is required");
      err.status = 400;
      throw err;
    }

    if (!VALID_STATUSES.includes(status)) {
      const err = new Error(`Task status must be one of: ${VALID_STATUSES.join(", ")}`);
      err.status = 400;
      throw err;
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      const err = new Error(`Task priority must be one of: ${VALID_PRIORITIES.join(", ")}`);
      err.status = 400;
      throw err;
    }

    return new Task({
      title:       title.trim(),
      description: description.trim(),
      status,
      priority,
      userStoryId,
      ...(assignedTo && { assignedTo }),
    });
  }
}

// Singleton exporté — les services importent cette instance directement
export const taskCreator = new TaskCreator();
