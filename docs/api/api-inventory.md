# API Inventory

| Method | Endpoint | Purpose | Auth | Backend Handler | Frontend Consumer | Status |
| ------ | -------- | ------- | ---- | --------------- | ----------------- | ------ |
| GET | `/institutes` | List all institutes | Authenticated (`adminapi`, `api`) | `InstitutesController.index` | `src/action/institute.ts` | Implemented |
| POST | `/institutes` | Create an institute | Authenticated + Permission | `InstitutesController.store` | `src/action/institute.ts` | Implemented |
| GET | `/institutes/:id` | View an institute | Authenticated + Permission | `InstitutesController.show` | `src/action/institute.ts` | Implemented |
| PUT/PATCH | `/institutes/:id` | Update an institute | Authenticated + Permission | `InstitutesController.update` | `src/action/institute.ts` | Implemented |
| DELETE | `/institutes/:id` | Delete an institute | Authenticated + Permission | `InstitutesController.destroy` | `src/action/institute.ts` | Implemented |
| GET | `/departments` | List all departments | Authenticated | `DepartmentsController.index` | `src/action/department.ts` | Implemented |
| POST | `/departments` | Create a department | Authenticated + Permission | `DepartmentsController.store` | `src/action/department.ts` | Implemented |
| GET | `/departments/:id` | View a department | Authenticated + Permission | `DepartmentsController.show` | `src/action/department.ts` | Implemented |
| PUT/PATCH | `/departments/:id` | Update a department | Authenticated + Permission | `DepartmentsController.update` | `src/action/department.ts` | Implemented |
| DELETE | `/departments/:id` | Delete a department | Authenticated + Permission | `DepartmentsController.destroy` | `src/action/department.ts` | Implemented |
| GET | `/student-queries/progress-report` | Student progress report | Authenticated + Permission | `StudentQueriesController.progressReport` | `src/action/progressReport.ts` | Implemented |
| GET | `/quizzes` | List all quizzes | Authenticated | `QuizzesControllersController.index` | `src/action/quiz.ts` | Implemented |
| POST | `/assignments` | Create assignment | Authenticated + Permission | `AssignmentsController.store` | `src/action/assignment.ts` | Implemented |
| GET | `/assignments` | List assignments | Authenticated + Permission | `AssignmentsController.index` | `src/action/assignment.ts` | Implemented |
| GET | `/faculty-leaves` | List faculty leaves | Permission | `FacultyLeaveController.index` | `src/action/facultyLeave.ts` | Implemented |
| POST | `/faculty-leaves` | Create faculty leave | Permission | `FacultyLeaveController.store` | `src/action/facultyLeave.ts` | Implemented |

> **Note:** This table covers core module APIs identified in the codebase.
