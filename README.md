# Gestion PFE – Backend (2025‑2026)

Backend d’une application de suivi de PFE “façon Jira” couvrant :
Projets → Sprints → User Stories → Tâches, validations par encadrants, réunions, versions de rapports et dashboard d’avancement.

---

## 1. Contexte & objectifs

- **Contexte** : mini‑projet de 4–5 semaines, backend API uniquement, tests via Postman.
- **Objectif** : fournir une API REST permettant à un futur frontend React de gérer :
  - Création et suivi d’un projet PFE et de ses sprints.
  - User stories et tâches avec workflow complet.
  - Réunions de suivi (planification + compte rendu + validation).
  - Versions de rapports de PFE.
  - Dashboard d’avancement et journal du stage.
- **Acteurs** :
  - **Étudiant** : crée et gère projet, sprints, user stories, tâches, réunions, rapports.
  - **Encadrant entreprise** : consulte et **valide/invalide** l’avancement des tâches.
  - **Encadrant universitaire** : consulte, **valide/invalide** les tâches et **valide le contenu des réunions**.

---

## 2. Technologies

- **Runtime:** Node.js & Express.js
- **Database:** MongoDB & Mongoose
- **Auth:** JSON Web Tokens (JWT)
- **Tests d’API** : Postman (collections livrées dans `postman/`).
- **Structure** :
  - `src/modules/Team_A` : Projets, Sprints, Dashboard agrégé.
  - `src/modules/Team_B` : User Stories, Rapports (versions).
  - `src/modules/Team_C` : Tâches, Workflow, Historique de statuts.
  - `src/modules/Team_D` : Validations, Réunions, liens vers US/Tâches/Rapports.

---

## 3. Organisation des équipes

- **Équipe A – Authentification & Projets & Sprints (+ Dashboard agrégé projet/sprint)**
  - Membres : Mohamed Ali Hosni et Mohamed Youssef Ben Tili

- **Équipe B – User Stories & Rapports (versions)**
  - Membres : Ghaya Ammari et Mongia Bahri

- **Équipe C – Tâches & Workflow (historiques)**
  - Membres : Mohamed Beldi et Amine Diden

- **Équipe D – Validations & Réunions**
  - Membres : Malek AbdelKhalek et Adam Kacem

---

## 4. Planning & deadlines (livrables intermédiaires)

Chaque équipe dispose de 4 deadlines correspondant aux mêmes périodes, avec des objectifs et livrables adaptés à leurs responsabilités.

---

# Équipe A — Projets & Sprints

### **Deadline 1 — 09/11/2025**
- Created the project structure and established database connection setup with Mongoose.
- Set up this GitHub repository and our team workflow.
- Implement authentication routes and middleware, add error handling and validation
- Developed email service for sending verification and password reset emails.
- Configured Nodemailer for email transport and created email templates for verification and password reset.
- Set up environment configuration for sensitive data management.
---

### **Deadline 2 — 16/11/2025**
- Add project management functionality with CRUD operations and authorization middleware
- Integrate Swagger for API documentation
---

### **Deadline 3 — 25/11/2025**
- Add sprint management functionality with CRUD operations and authorization middleware
- Refactor authentication middleware, and enhance project routes
- Adjusted project routes to streamline authorization checks and improve code organization.
---

### **Deadline 4 — 07/12/2025**
- Enhance API documentation with Swagger for various routes
- Endpoints Dashboard :
  - État d’avancement global par projet.
  - État d’avancement par sprint.
- Journal du stage (fil chronologique unifié) combinant :
  - Réunions.
  - Validations.
  - Changements de statut de tâche.
  - Dépôts de rapports.
- Calcul et exposition des “items en Standby” (tâches bloquées).
- Finalisez toutes les fonctionnalités, complétez le collections Postman et corrigez tous les bugs restants.

---

# Équipe B — User Stories & Report Versions
### **Deadline 1 — 24/11/2025**
Implémentation du CRUD complet sur les User Stories :

- Création d’une User Story

- Consultation de toutes les User Stories

- Mise à jour d’une User Story

- Suppression d’une User Story

### **Deadline 2 — 30/11/2025**
- Correction des erreurs liées à la mise à jour des User Stories

- Début de l’implémentation du CRUD des Rapports


### **Deadline 3 — 3/12/2025**
- Finalisation du CRUD des Rapports

- Mise en place de la documentation API avec Swagger 

### **Deadline 4 — 07/12/2025**
- Finalisation de toutes les fonctionnalités

- Complétion de la collection Postman

- Correction des bugs restants

# Équipe C — Tasks & Workflow

### **Deadline 1 — 23/11/2025**
- Implement basic Task model.

- Implement Task Model and CRUD operations.

- Implement Task History model.

### **Deadline 2 — 30/11/2025**
- Create TaskValidator model (status requests from student).

- Implement “status update request” logic (Student requests a change, Status stays pending until supervisor validation)

- New specific GET routes for Task (For specific filter like all Tasks that can be visible for a specific supervisor)

### **Deadline 3 — 03/12/2025**
- Integrate Task History feature to the workflow (adding new status history when there is an update).

- Implement Task History operational CRUD operations.

- Implement Swagger documentation logic.

- Add reporting generators.

### **Deadline 4 — 07/12/2025**
- Ensure all Team C functions are done (Fixing bugs if needed).

- Prepare Postman collections.

# Équipe D — Meetings, Validations 

### **Deadline 1 — 24/11/2025**
- Implement meeting creation (planned date, agenda).

- Add CRUD operations for meetings (create, update, view, delete) restricted to student permissions.

- Implement validation model structure (status, author, date, linked meeting or “hors réunion”).

- Establish linking between meetings and related items (User Stories, Tasks, Reports).

### **Deadline 2 — 30/11/2025**
- Implement task validation feature (validate/invalidate tasks marked as “Done”).

- Add rules ensuring only enterprise/university supervisors can validate tasks.

- Add meeting completion feature: adding real summary after the meeting.

- Integrate validation logic with meeting references (“linked to meeting” or “hors réunion”).


### **Deadline 3 — 3/12/2025**
- Implement validation workflow for meeting content (university supervisor approval).

- Add API documentation using Swagger for all meetings & validations endpoints.

- Improve authorization middleware to enforce student/supervisor role permissions.

- Add consistency checks between meetings, tasks, user stories and reports (e.g., cannot reference non-existing items).

### **Deadline 4 — 07/12/2025**
- Finalize all meeting & validation features.

- Complete Postman collection with all endpoints and scenarios.

- Fix remaining bugs and ensure all business rules are fully respected.

## 5. Livrables finaux

Conformément au cahier des charges :

- **API fonctionnelles** couvrant le périmètre :
  - Projets, Sprints, User Stories, Tâches.
  - Workflow des tâches avec historique.
  - Validations de tâches.
  - Réunions (planification + compte rendu + validation de contenu).
  - Versions de rapports.
  - Dashboard d’avancement et journal du stage.
- **Collections Postman**
  - Dossier : `postman/`
- **Diagramme de classe**
  - Fichier : `docs/diagramme-classe.(png|jpg)`

---

## 6. Règles de gestion (rappel)

- **Création / modification de contenu**
  - Seul l’**étudiant** peut créer :
    - Projet, sprints, user stories, tâches.
    - Planifier/modifier les réunions.
    - Uploader des versions de rapport.
- **Rôle des encadrants**
  - Encadrants ne modifient pas le contenu créé par l’étudiant.
  - Encadrant entreprise et universitaire :
    - Peuvent **valider/invalider** l’avancement d’une tâche.
  - Encadrant universitaire :
    - Valide le **contenu des réunions**.
- **Validations de tâches**
  - Ne concernent que les tâches au statut `Done`.
  - Chaque validation contient obligatoirement :
    - Statut validé.
    - Auteur (encadrant).
    - Date.
    - Réunion liée (ou valeur spéciale “hors réunion”).

---

## 7. Structure du projet (indicative)

```bash
├──src/
│    ├── modules/
│    │    ├── Authentification/
│    │    │   ├── controllers/
│    │    │   ├── models/
│    │    │   ├── routes/
│    │    │   ├── services/
│    │    │   ├── utils/
│    │    │   ├── validators/
│    │    │   └── index.js
│    │    ├── Team_A/
│    │    │   ├── controllers/
│    │    │   ├── models/
│    │    │   ├── routes/
│    │    │   ├── services/
│    │    │   ├── validators/
│    │    │   └── index.js
│    │    ├── Team_B/
│    │    │   ├── controllers/
│    │    │   ├── models/
│    │    │   ├── routes/
│    │    │   ├── services/
│    │    │   ├── validators/
│    │    │   └── index.js
│    │    ├── Team_C/
│    │    │   ├── controllers/
│    │    │   ├── models/
│    │    │   ├── routes/
│    │    │   ├── services/
│    │    │   ├── validators/
│    │    │   └── index.js
│    │    └── Team_D/
│    │        ├── controllers/
│    │        ├── models/
│    │        ├── routes/
│    │        ├── services/
│    │        ├── validators/
│    │        └── index.js
│    └── shared/
│        ├── config/
│        ├── db/
│        ├── middlewares/
│        ├── services/
│        └── utils/
└── server.js
```

Ce projet utilise une **architecture modulaire (feature-based)** combinée à une approche **MVC légère / clean architecture**.  
Chaque fonctionnalité est isolée dans un module autonome situé dans `src/modules/`, tandis que les éléments transversaux sont regroupés dans `src/shared/`.

## Description des dossiers

### `src/`
Racine du code source de l'application.

---

### `src/modules/`
Chaque dossier représente un **module fonctionnel** (une feature).  
Chaque module contient :

- **controllers/**  
  Gèrent les requêtes HTTP. Reçoivent `req`, appellent les services et renvoient la réponse.  
  → *Ils ne contiennent pas de logique métier lourde.*

- **services/**  
  Contiennent la logique métier, les traitements complexes, l'interaction avec les modèles et la base de données.  
  → *C’est le cœur de l’application.*

- **models/**  
  Définition des entités persistées (ex : schémas Mongoose, ORM, DTOs).  
  → *Représente les données manipulées par le module.*

- **routes/**  
  Exposent les endpoints de l’API et relient les routes aux controllers et middlewares.  
  → *Couche déclarative du module.*

- **validators/**  
  Valident les entrées utilisateurs (body, params, query) via Joi, Zod, Yup ou express-validator.  
  → *Évitent les données invalides dès l'entrée.*

- **utils/**  
  Fonctions utilitaires propres au module.

- **index.js**  
  Point d'entrée du module.  
  Il exporte généralement le router pour être monté automatiquement dans `server.js`.

---

### `src/shared/`
Contient les composants **transverses** utilisés par plusieurs modules.

- **config/**  
  Gestion des variables d’environnement et configuration globale de l’application.

- **db/**  
  Connexion à la base de données, initialisation, migrations éventuelles.

- **middlewares/**  
  Middlewares globaux :  
  - Authentification  
  - Logging  
  - Validation générique  
  - Gestion des erreurs globales  
  - Rate limiting

  → *Ils exécutent du traitement avant ou après les controllers.*

- **services/**  
  Services réutilisables et communs à tous les modules :  
  mailer, cache, stockage, API externes, file d’attente, etc.

- **utils/**  
  Helpers génériques (formatage, dates, générateurs, encodage…).

---

### `server.js`
Point d’entrée du backend.  
Il :

- initialise les middlewares globaux  
- charge dynamiquement les modules (`src/modules/.../index.js`)  
- gère les erreurs globales  
- démarre le serveur HTTP  

---

## Pourquoi cette architecture ?

- Séparation claire des responsabilités  
- Scalabilité : chaque module est indépendant  
- Travail en équipe simplifié : chaque membre peut travailler sur un module  
- Maintenance facilitée  
- Réutilisation des services partagés

## 8. Installation & exécution

### Prérequis

- Node.js (version recommandée : 18+)
- npm ou yarn

### Installation

1.  **Clone le github repo:**

    ```bash
    git clone https://github.com/MA-Hosni/gestion_PFE
    cd gestion_PFE
    ```

2.  **Installer les packages:**

    ```bash
    npm install
    ```

3.  **Configurez votre fichier `.env`:**

    Créez un fichier `.env` dans le dossier racine et ajoutez votre propre chaîne de connexion MongoDB ainsi qu'un secret JWT.

    ```
    NODE_ENV = development
    PORT = 3000
    MONGO_URI = "YOUR_MONGODB_CONNECTION_STRING"
    JWT_SECRET = "ANY_RANDOM_SECRET_KEY"
    JWT_ACCESS_EXPIRES_IN = 15m
    JWT_REFRESH_EXPIRES_IN = 7d
    BCRYPT_SALT_ROUNDS = 12
    CORS_ORIGIN = http://localhost:3000
    NODEMAILER_EMAIL =
    NODEMAILER_PASSWORD =
    APP_NAME = "PFE Management System"
    FRONTEND_URL = "http://localhost:3000"
    EMAIL_FROM_NAME = "PFE Management Team"
    ```

4.  **Start the server:**
    ```bash
    npm run dev
    ```
    Le serveur fonctionnera sur `http://localhost:3000`. (vous pouvez changer le port pour celui que vous souhaitez)

---

## 9. Tests avec Postman

1. Importer la collection depuis le dossier `postman/`.
2. Configurer l’environnement (URL de base, éventuels tokens…).
3. Exécuter les scénarios de bout en bout :
   - Création projet → sprint → US → tâches → workflow.
   - Validations par encadrants.
   - Réunions & rapports.
   - Dashboard & journal.

Minor update