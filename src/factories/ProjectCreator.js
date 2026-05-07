/**
 * GoF Factory Method — Concrete Creator (Création)
 * GRASP Creator — possède toutes les données d'initialisation nécessaires à la création d'un Project
 * SRP — responsabilité unique : instancier et valider un Project Mongoose
 */
import IProjectCreator from "./interfaces/IProjectCreator.js";
import Project from "../modules/Team_A/models/project.model.js";

export default class ProjectCreator extends IProjectCreator {
  /**
   * Factory Method — crée un document Project validé (non sauvegardé).
   *
   * @param {Object}   data
   * @param {string}   data.title
   * @param {string}   [data.description]
   * @param {string}   data.startDate  – ISO date string
   * @param {string}   data.endDate    – ISO date string
   * @param {string[]} [data.contributors]
   * @returns {import('mongoose').Document}
   */
  create({ title, description = "", startDate, endDate, contributors = [] }) {
    if (!title?.trim()) {
      const err = new Error("Project title is required");
      err.status = 400;
      throw err;
    }

    if (!startDate || !endDate) {
      const err = new Error("Project startDate and endDate are required");
      err.status = 400;
      throw err;
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const err = new Error("Project dates must be valid ISO dates");
      err.status = 400;
      throw err;
    }

    if (end <= start) {
      const err = new Error("Project endDate must be strictly after startDate");
      err.status = 400;
      throw err;
    }

    return new Project({
      title:        title.trim(),
      description:  description.trim(),
      startDate:    start,
      endDate:      end,
      contributors: [...new Set(contributors.map(String))],
      sprints:      [],
      reports:      [],
    });
  }
}

// Singleton exporté — les services importent cette instance directement
export const projectCreator = new ProjectCreator();
