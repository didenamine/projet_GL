/**
 * GoF Factory Method — Concrete Creator (Création)
 * GRASP Creator — possède toutes les données d'initialisation nécessaires à la création d'une UserStory
 * SRP — responsabilité unique : instancier et valider une UserStory Mongoose
 */
import IUserStoryCreator from "./interfaces/IUserStoryCreator.js";
import UserStory from "../modules/Team_B/models/UserStory.model.js";

const VALID_PRIORITIES = ["grand", "highest", "high", "medium", "low", "lowest"];

export default class UserStoryCreator extends IUserStoryCreator {
  /**
   * Factory Method — crée un document UserStory validé (non sauvegardé).
   *
   * @param {Object} data
   * @param {string} data.storyName
   * @param {string} [data.description]
   * @param {string} data.priority          – l'un de VALID_PRIORITIES
   * @param {number} data.storyPointEstimate – nombre non-négatif
   * @param {string} data.startDate         – ISO date string
   * @param {string} data.dueDate           – ISO date string
   * @param {string} data.sprintId
   * @returns {import('mongoose').Document}
   */
  create({ storyName, description = "", priority, storyPointEstimate, startDate, dueDate, sprintId }) {
    if (!storyName?.trim()) {
      const err = new Error("UserStory storyName is required");
      err.status = 400;
      throw err;
    }

    if (!sprintId) {
      const err = new Error("UserStory sprintId is required");
      err.status = 400;
      throw err;
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      const err = new Error(`UserStory priority must be one of: ${VALID_PRIORITIES.join(", ")}`);
      err.status = 400;
      throw err;
    }

    if (typeof storyPointEstimate !== "number" || storyPointEstimate < 0) {
      const err = new Error("UserStory storyPointEstimate must be a non-negative number");
      err.status = 400;
      throw err;
    }

    const start = new Date(startDate);
    const due   = new Date(dueDate);

    if (isNaN(start.getTime()) || isNaN(due.getTime())) {
      const err = new Error("UserStory dates must be valid ISO dates");
      err.status = 400;
      throw err;
    }

    if (due <= start) {
      const err = new Error("UserStory dueDate must be strictly after startDate");
      err.status = 400;
      throw err;
    }

    return new UserStory({
      storyName:          storyName.trim(),
      description:        description.trim(),
      priority,
      storyPointEstimate,
      startDate:          start,
      dueDate:            due,
      sprintId,
      tasks:              [],
    });
  }
}

// Singleton exporté — les services importent cette instance directement
export const userStoryCreator = new UserStoryCreator();
