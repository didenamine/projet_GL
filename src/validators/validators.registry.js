import ValidatorFactory from "./ValidatorFactory.js";

import CompanyValidator from "./CompanyValidator.js";
import UniversityValidator from "./UniversityValidator.js";

ValidatorFactory.register("CompSupervisor", CompanyValidator);
ValidatorFactory.register("UniSupervisor", UniversityValidator);