import CompanyValidator from "./CompanyValidator.js";
import UniversityValidator from "./UniversityValidator.js";

const validatorMap = {
  CompSupervisor: CompanyValidator,
  UniSupervisor: UniversityValidator,
};

export default class ValidatorFactory {
  static get(role, supervisorId) {
    const ValidatorClass = validatorMap[role];

    if (!ValidatorClass) {
      throw new Error(`ValidatorFactory: unsupported role '${role}'.`);
    }

    return new ValidatorClass(supervisorId);
  }
}
