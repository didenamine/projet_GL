import CompanyValidator from "./CompanyValidator.js";
import UniversityValidator from "./UniversityValidator.js";

export default class ValidatorFactory {
  static validators = new Map();

  static register(role, validatorClass) {
    this.validators.set(role, validatorClass);
  }

  static get(role, supervisorId) {
    const ValidatorClass = this.validators.get(role);

    if (!ValidatorClass) {
      throw new Error(`Unsupported validator role: ${role}`);
    }

    return new ValidatorClass(supervisorId);
  }
}
