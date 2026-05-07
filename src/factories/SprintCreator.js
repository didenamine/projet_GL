/**
 * GoF Factory Method — Concrete Creator (Création)
 * GRASP Creator — possède toutes les données d'initialisation nécessaires à la création d'un Sprint
 * SRP — responsabilité unique : instancier et valider un Sprint Mongoose
 */
import ISprintCreator from "./interfaces/ISprintCreator.js";
import Sprint from "../modules/Team_A/models/sprint.model.js";

export default class SprintCreator extends ISprintCreator {
  /**
   * Factory Method — crée un document Sprint validé (non sauvegardé).
   *
   * Les dates du sprint doivent être comprises dans les bornes du projet parent
   * (contrainte OCL : Sprint.startDate >= Project.startDate
   *                  Sprint.endDate   <= Project.endDate).
   *
   * @param {Object}                       data
   * @param {string}                       data.title
   * @param {string}                       data.goal
   * @param {string}                       data.startDate  – ISO date string
   * @param {string}                       data.endDate    – ISO date string
   * @param {import('mongoose').Document}  data.project    – document Project parent
   * @returns {import('mongoose').Document}
   */
  create({ title, goal, startDate, endDate, project }) {
    if (!title?.trim()) {
      const err = new Error("Sprint title is required");
      err.status = 400;
      throw err;
    }

    if (!goal?.trim()) {
      const err = new Error("Sprint goal is required");
      err.status = 400;
      throw err;
    }

    if (!project?._id) {
      const err = new Error("A valid parent Project document is required");
      err.status = 400;
      throw err;
    }

    const sStart = new Date(startDate);
    const sEnd   = new Date(endDate);

    if (isNaN(sStart.getTime()) || isNaN(sEnd.getTime())) {
      const err = new Error("Sprint dates must be valid ISO dates");
      err.status = 400;
      throw err;
    }

    if (sStart < new Date(project.startDate)) {
      const err = new Error(
        `OCL violation: Sprint startDate (${sStart.toISOString()}) must be >= Project startDate (${new Date(project.startDate).toISOString()})`
      );
      err.status = 400;
      throw err;
    }

    if (sEnd > new Date(project.endDate)) {
      const err = new Error(
        `OCL violation: Sprint endDate (${sEnd.toISOString()}) must be <= Project endDate (${new Date(project.endDate).toISOString()})`
      );
      err.status = 400;
      throw err;
    }

    if (sEnd <= sStart) {
      const err = new Error("Sprint endDate must be strictly after startDate");
      err.status = 400;
      throw err;
    }

    const orderIndex = project.sprints.length + 1;

    return new Sprint({
      title:       title.trim(),
      goal:        goal.trim(),
      startDate:   sStart,
      endDate:     sEnd,
      orderIndex,
      projectId:   project._id,
      userStories: [],
    });
  }
}

// Singleton exporté — les services importent cette instance directement
export const sprintCreator = new SprintCreator();
