import IValidator from "./IValidator.js";
import UniSupervisor from "../modules/Authentication/models/uniSupervisor.model.js";

export default class UniversityValidator extends IValidator {
  constructor(supervisorId) {
    super(supervisorId);
  }

  getType() {
    return "UniSupervisor";
  }

  async _getSupervisedStudentIds() {
    const supervisor = await UniSupervisor.findById(this.supervisorId).select("studentsId");
    if (!supervisor) {
      return [];
    }
    return supervisor.studentsId.map((studentId) => studentId.toString());
  }

  async canValidate(taskId, supervisorId = null) {
    const context = await this._loadTaskProject(taskId);
    if (!context) {
      return false;
    }

    const supervisedStudentIds = await this._getSupervisedStudentIds();
    const projectStudentIds = context.project.contributors.map((student) => student._id.toString());

    return projectStudentIds.some((id) => supervisedStudentIds.includes(id));
  }
}
