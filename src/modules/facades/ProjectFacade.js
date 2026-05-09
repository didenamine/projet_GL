import * as projectService from "../Team_A/services/project.service.js";
import * as sprintService from "../Team_A/services/sprint.service.js";
import * as taskService from "../Team_C/services/task.service.js";
import * as reportService from "../Team_B/services/Report.service.js";
import Project from "../Team_A/models/project.model.js";

class ProjectFacade {
  async bootstrapProject(dto, studentId) {
    return projectService.createProject(dto, studentId);
  }

  async addSprint(projectId, dto, studentId) {
    return sprintService.createSprint({ ...dto, projectId }, studentId);
  }

  async assignTask(userStoryId, dto) {
    return taskService.createTask({ ...dto, userStoryId });
  }

  async validateTask(taskId, validationDto, supervisorId) {
    return taskService.updateTaskStatus(taskId, {
      ...validationDto,
      validatorId: supervisorId
    });
  }

  async generateReport(projectId, dto, studentId, file) {
    return reportService.createReport(studentId, dto, file);
  }

  async getProject(projectId) {
    return projectService.getProject(projectId);
  }

  async updateProject(projectId, updateData) {
    return projectService.updateProject(projectId, updateData);
  }

  async deleteProject(projectId) {
    return projectService.deleteProject(projectId);
  }

  async getStudentsWithoutProject() {
    return projectService.getStudentsWithoutProject();
  }

  async addContributors(payload) {
    return projectService.addContributors(payload);
  }

  async removeContributors(payload) {
    return projectService.removeContributors(payload);
  }
}

class ArchivableProjectFacade extends ProjectFacade {
  async archiveProject(projectId, studentId) {
    const project = await Project.findOne({
      _id: projectId,
      deletedAt: null,
      contributors: studentId
    });

    if (!project) {
      const error = new Error("Project not found or you are not authorized to archive it");
      error.status = 404;
      throw error;
    }

    project.deletedAt = new Date();
    await project.save();

    return {
      success: true,
      message: "Project archived successfully",
      data: {
        projectId: project._id
      }
    };
  }
}

export const projectFacade = new ProjectFacade();
export const archivableProjectFacade = new ArchivableProjectFacade();
