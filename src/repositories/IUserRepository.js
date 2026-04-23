export default class IUserRepository {
  constructor() {
    if (new.target === IUserRepository) {
      throw new Error("IUserRepository is an abstract interface and cannot be instantiated directly.");
    }
  }

  async findById(userId) {
    throw new Error("findById() must be implemented by a concrete repository.");
  }

  async findSupervisorByUserId(userId) {
    throw new Error("findSupervisorByUserId() must be implemented by a concrete repository.");
  }

  async findStudentsBySupervisorId(supervisorId) {
    throw new Error("findStudentsBySupervisorId() must be implemented by a concrete repository.");
  }
}
