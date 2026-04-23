import Project from "../modules/Team_A/models/project.model.js";
import Sprint  from "../modules/Team_A/models/sprint.model.js";
import Report  from "../modules/Team_B/models/report.model.js";

export class ProjectFactory {

  static create({ title, description = "", startDate, endDate, contributors = [] }) {
    if (!title?.trim()) {
      const err = new Error("Project title is required"); err.status = 400; throw err;
    }
    if (!startDate || !endDate) {
      const err = new Error("Project startDate and endDate are required"); err.status = 400; throw err;
    }
    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const err = new Error("Project dates must be valid ISO dates"); err.status = 400; throw err;
    }
    if (end <= start) {
      const err = new Error("Project endDate must be strictly after startDate"); err.status = 400; throw err;
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

  static createSprint({ title, goal, startDate, endDate, project }) {
    if (!title?.trim()) {
      const err = new Error("Sprint title is required"); err.status = 400; throw err;
    }
    if (!goal?.trim()) {
      const err = new Error("Sprint goal is required"); err.status = 400; throw err;
    }
    if (!project?._id) {
      const err = new Error("A valid parent Project document is required"); err.status = 400; throw err;
    }
    const sStart = new Date(startDate);
    const sEnd   = new Date(endDate);
    if (isNaN(sStart.getTime()) || isNaN(sEnd.getTime())) {
      const err = new Error("Sprint dates must be valid ISO dates"); err.status = 400; throw err;
    }
    if (sStart < new Date(project.startDate)) {
      const err = new Error(
        `OCL violation: Sprint startDate (${sStart.toISOString()}) must be >= Project startDate (${new Date(project.startDate).toISOString()})`
      ); err.status = 400; throw err;
    }
    if (sEnd > new Date(project.endDate)) {
      const err = new Error(
        `OCL violation: Sprint endDate (${sEnd.toISOString()}) must be <= Project endDate (${new Date(project.endDate).toISOString()})`
      ); err.status = 400; throw err;
    }
    if (sEnd <= sStart) {
      const err = new Error("Sprint endDate must be strictly after startDate"); err.status = 400; throw err;
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

  static createReport({ versionLabel, notes, filePath, projectId }) {
    if (!Number.isInteger(versionLabel) || versionLabel < 1) {
      const err = new Error("Report versionLabel must be a positive integer"); err.status = 400; throw err;
    }
    if (!notes?.trim()) {
      const err = new Error("Report notes are required"); err.status = 400; throw err;
    }
    if (!filePath?.trim()) {
      const err = new Error("Report filePath is required"); err.status = 400; throw err;
    }
    if (!projectId) {
      const err = new Error("Report projectId is required"); err.status = 400; throw err;
    }
    return new Report({
      versionLabel,
      notes:    notes.trim(),
      filePath: filePath.trim(),
      projectId,
    });
  }
}
