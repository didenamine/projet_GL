export default class IProjectRepository {
  constructor() {
    if (new.target === IProjectRepository) {
      throw new Error("IProjectRepository is an abstract interface and cannot be instantiated directly.");
    }
  }

  async findById(projectId) {
    throw new Error("findById() must be implemented by a concrete repository.");
  }

  async findByContributorId(studentId) {
    throw new Error("findByContributorId() must be implemented by a concrete repository.");
  }

  async findProjectByTaskId(taskId) {
    throw new Error("findProjectByTaskId() must be implemented by a concrete repository.");
  }
}
