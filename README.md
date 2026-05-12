# Gestion PFE - Backend

Backend Express/MongoDB pour une application de suivi de PFE inspiree de Jira :
projets, sprints, user stories, taches, validations par encadrants, reunions,
versions de rapports et dashboard d'avancement.

## Sommaire

- [Contexte](#contexte)
- [Stack technique](#stack-technique)
- [Fonctionnalites](#fonctionnalites)
- [Architecture](#architecture)
- [Design patterns et principes](#design-patterns-et-principes)
- [Structure du projet](#structure-du-projet)
- [Installation](#installation)
- [Execution et tests](#execution-et-tests)
- [Documentation](#documentation)

## Contexte

Le projet couvre le suivi complet d'un stage PFE :

- un etudiant cree et gere son projet, ses sprints, ses user stories, ses taches,
  ses reunions et ses rapports ;
- un encadrant entreprise consulte l'avancement et valide/invalide les taches ;
- un encadrant universitaire consulte l'avancement, valide/invalide les taches et
  valide le contenu des reunions.

## Stack technique

- **Runtime** : Node.js avec modules ES
- **Framework API** : Express.js
- **Base de donnees** : MongoDB avec Mongoose
- **Authentification** : JWT, hash de mots de passe avec bcrypt/bcryptjs
- **Validation d'entrees** : Joi via un middleware commun
- **Upload** : Multer pour les rapports
- **Documentation API** : Swagger UI sur `/docs`
- **Tests** : `node:test`
- **Lint** : ESLint

## Fonctionnalites

- Authentification et gestion des utilisateurs :
  inscription et connexion des etudiants, encadrants entreprise et encadrants
  universitaires, verification email, reset password, JWT access/refresh tokens.
- Projets et contributeurs :
  creation, lecture, modification, suppression logique, ajout/retrait de
  contributeurs et recherche d'etudiants sans projet.
- Sprints :
  creation dans la periode du projet, modification, suppression logique et
  reordonnancement.
- User stories :
  CRUD, rattachement a un sprint, contraintes de dates et story points.
- Taches :
  CRUD partiel, workflow de statuts, demandes de changement de statut,
  validation par encadrant, historique des changements et rapports projet/sprint.
- Rapports :
  upload de versions, consultation par etudiant ou encadrant, unicite des
  versions par projet, suppression logique.
- Reunions et validations :
  planification, compte rendu, validation universitaire du contenu, validations
  de taches liees ou hors reunion.
- Dashboard :
  progression projet, timeline et vues superviseur/etudiant.

## Architecture

L'application est organisee par modules fonctionnels dans `src/modules/`.
Chaque module suit une separation simple :

- `routes/` expose les endpoints Express et applique les middlewares.
- `controllers/` traduit HTTP vers les services.
- `services/` porte les regles metier et l'orchestration Mongoose.
- `models/` contient les schemas Mongoose.
- `validators/` contient les schemas Joi.
- `index.js` monte les routes du module.

Les elements transverses sont isoles hors modules :

- `src/shared/` : configuration, connexion DB, middlewares, email service et
  templates.
- `src/factories/` : creation controlee des entites metier.
- `src/states/` : workflow de statuts de tache.
- `src/validators/` : strategies de validation superviseur.
- `src/events/` : bus d'evenements et observers.
- `src/modules/facades/` : facade applicative autour des workflows projet.
- `src/repositories/` : interfaces de repository preparees pour l'inversion de
  dependance.

Les routes sont montees dans `server.js` avec le prefixe `/api` :

- `/api/auth`
- `/api/project`
- `/api/project/sprints`
- `/api/dashboard`
- `/api/user-story`
- `/api/report`
- `/api/tasks`
- `/api/meetings`
- `/api/validations`

## Design Patterns Et Principes

### Factory Method

Les factories centralisent la creation et les invariants de base des objets :

- `src/factories/ProjectFactory.js`
  - `create()` pour les projets ;
  - `createSprint()` pour les sprints, avec verification des dates par rapport
    au projet ;
  - `createReport()` pour les versions de rapport.
- `src/factories/TaskFactory.js`
  - `createUserStory()` pour les user stories ;
  - `create()` fournit la meme logique de creation controlee pour les taches.

Elles evitent de disperser les validations de construction dans les services.
Aujourd'hui, `ProjectFactory` est utilisee par les services projet, sprint et
rapport, tandis que `TaskFactory.createUserStory()` est utilisee par le service
des user stories.

### State Pattern

Le workflow des taches est gere dans `src/states/` :

- `ITaskState` definit le contrat commun ;
- `ToDoState`, `InProgressState`, `StandbyState`, `DoneState` representent les
  etats concrets ;
- `TaskStateManager` joue le role de contexte et controle les transitions.

Transitions autorisees :

```text
ToDo -> InProgress
InProgress -> Standby
InProgress -> Done
Standby -> InProgress
Done -> aucun changement
```

Le service de taches valide la transition avant de creer une demande de
validation, puis applique reellement la transition uniquement apres validation
d'un encadrant.

### Facade

`src/modules/facades/ProjectFacade.js` fournit une entree simplifiee pour les
workflows projet :

- creation de projet ;
- ajout de sprint ;
- creation de tache ;
- validation de statut ;
- generation de rapport ;
- operations de consultation, mise a jour, suppression et contribution.

Les controllers appellent la facade pour eviter de connaitre directement tous
les services impliques.

### Strategy + Factory

La validation par encadrant utilise une strategie par role :

- `IValidator` definit l'algorithme commun de validation ;
- `CompanyValidator` gere les regles de l'encadrant entreprise ;
- `UniversityValidator` gere les regles de l'encadrant universitaire ;
- `ValidatorFactory` choisit la strategie selon le role (`CompSupervisor` ou
  `UniSupervisor`).

Ce design applique le polymorphisme GRASP et prepare l'ajout de nouveaux types
de validateurs sans modifier les services de taches ou de validations.

### Observer

Le module d'authentification ne contacte plus directement le service email.
Il publie des evenements via `src/events/EventBus.js` :

- `USER_REGISTERED`
- `EMAIL_VERIFICATION_REQUESTED`
- `PASSWORD_RESET_REQUESTED`

`EmailNotificationObserver` ecoute ces evenements et delegue l'envoi au service
email. Le demarrage des observers se fait dans `server.js`.

### ISP, DIP et LSP

- Les interfaces d'observers (`IEmailObserver`, `ILogObserver`,
  `INotificationObserver`) separent les contrats au lieu d'imposer une grosse
  interface unique.
- `IProjectRepository` et `IUserRepository` documentent les contrats attendus
  pour isoler les services de details de persistence quand des implementations
  concretes seront ajoutees.
- `tests/taskStateLsp.test.js` verifie que tous les etats concrets restent
  substituables a `ITaskState` et que `TaskStateManager` refuse les transitions
  invalides.

### Contraintes OCL

Certaines regles metier sont formalisees comme contraintes OCL puis appliquees
dans le code :

- une user story doit avoir `dueDate > startDate` ;
- `storyPointEstimate` doit appartenir a la suite `{1, 2, 3, 5, 8, 13}` ;
- un sprint doit rester dans la periode de son projet.

## Structure Du Projet

```text
.
├── server.js
├── package.json
├── docs/
│   ├── Cahier de charges 2025-2026.pdf
│   └── Class diagram.png
├── tests/
│   └── taskStateLsp.test.js
└── src/
    ├── events/
    │   ├── EventBus.js
    │   ├── interfaces/
    │   └── observers/
    ├── factories/
    │   ├── ProjectFactory.js
    │   └── TaskFactory.js
    ├── modules/
    │   ├── Authentication/
    │   ├── Team_A/
    │   ├── Team_B/
    │   ├── Team_C/
    │   ├── Team_D/
    │   └── facades/
    ├── repositories/
    ├── shared/
    │   ├── config/
    │   ├── db/
    │   ├── middlewares/
    │   ├── services/
    │   └── utils/
    ├── states/
    └── validators/
```

## Installation

### Prerequis

- Node.js 18+
- npm
- MongoDB accessible localement ou via une URI distante

### Etapes

```bash
npm install
```

Creer un fichier `.env` a la racine :

```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/gestion_pfe
JWT_SECRET=change_me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000
NODEMAILER_EMAIL=
NODEMAILER_PASSWORD=
APP_NAME=PFE Management System
FRONTEND_URL=http://localhost:5173
EMAIL_FROM_NAME=PFE Management Team
```

## Execution Et Tests

Demarrer en developpement :

```bash
npm run dev
```

Demarrer en mode standard :

```bash
npm start
```

Lancer les tests :

```bash
npm test
```

Lancer ESLint :

```bash
npm run lint
```

## Documentation

- Swagger UI : `http://localhost:3000/docs` si `PORT=3000`
- Cahier des charges : `docs/Cahier de charges 2025-2026.pdf`
- Diagramme de classe : `docs/Class diagram.png`

Les fichiers uploades des rapports sont stockes sous `uploads/reports/`.
