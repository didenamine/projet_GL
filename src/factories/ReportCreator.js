/**
 * GoF Factory Method — Concrete Creator (Création)
 * GRASP Creator — possède toutes les données d'initialisation nécessaires à la création d'un Report
 * SRP — responsabilité unique : instancier et valider un Report Mongoose
 */
import IReportCreator from "./interfaces/IReportCreator.js";
import Report from "../modules/Team_B/models/report.model.js";

export default class ReportCreator extends IReportCreator {
  /**
   * Factory Method — crée un document Report validé (non sauvegardé).
   *
   * @param {Object}                         data
   * @param {number}                         data.versionLabel – entier positif
   * @param {string}                         data.notes
   * @param {string}                         data.filePath
   * @param {import('mongoose').Types.ObjectId} data.projectId
   * @returns {import('mongoose').Document}
   */
  create({ versionLabel, notes, filePath, projectId }) {
    if (!Number.isInteger(versionLabel) || versionLabel < 1) {
      const err = new Error("Report versionLabel must be a positive integer");
      err.status = 400;
      throw err;
    }

    if (!notes?.trim()) {
      const err = new Error("Report notes are required");
      err.status = 400;
      throw err;
    }

    if (!filePath?.trim()) {
      const err = new Error("Report filePath is required");
      err.status = 400;
      throw err;
    }

    if (!projectId) {
      const err = new Error("Report projectId is required");
      err.status = 400;
      throw err;
    }

    return new Report({
      versionLabel,
      notes:    notes.trim(),
      filePath: filePath.trim(),
      projectId,
    });
  }
}

// Singleton exporté — les services importent cette instance directement
export const reportCreator = new ReportCreator();
