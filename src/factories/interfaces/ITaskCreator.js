/**
 * GoF Factory Method — Abstract Creator (Création)
 * GRASP Creator — délègue la création à celui qui possède les données d'initialisation
 * SRP — responsabilité unique : déclarer le contrat de création d'une Task
 */
export default class ITaskCreator {
  /**
   * Factory Method — doit être surchargée par les créateurs concrets.
   * @param {Object} data
   * @returns {import('mongoose').Document} instance Mongoose non sauvegardée
   */
  create(data) {
    throw new Error(
      `${this.constructor.name} must implement create(data)`
    );
  }
}
