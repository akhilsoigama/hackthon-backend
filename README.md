# Backend Documentation of E-learning Platform for Nabha 

## API Routes

---

## 🔑 Authentication
| Method | Route        | Handler                    | Middleware |
|--------|-------------|----------------------------|------------|
| POST   | `/login`    | `AuthController.login`     | -          |
| GET    | `/profile`  | `AuthController.getProfile`| -          |

---

## 🤖 Chatbot
| Method | Route       | Handler                    | Middleware |
|--------|-------------|----------------------------|------------|
| POST   | `/chatbot`  | `ChatBotController.chat`   | -          |

---

## 🛡 Roles & Permissions
| Method | Route                  | Handler                                     | Middleware         |
|--------|------------------------|---------------------------------------------|--------------------|
| GET    | `/roles/:id`           | `RolesController.getRoleWithPermissions`    | `auth, permission` |
| POST   | `/roles`               | `RolesController.createRoleWithPermissions` | `auth, permission` |
| PUT    | `/roles/:id`           | `RolesController.updateRole`                | `auth, permission` |
| GET    | `/roles`               | `RolesController.getAllRoleWithPermissions` | `auth, permission` |
| GET    | `/permissions`         | `PermissionsController.getAllPermissions`   | `auth, permission` |

---

## 👤 User Management
| Method | Route                        | Handler                          | Middleware         |
|--------|------------------------------|----------------------------------|--------------------|
| GET    | `/users` (users.index)       | `UsersController.index`          | `auth, permission` |
| POST   | `/users` (users.store)       | `UsersController.store`          | `auth, permission` |
| GET    | `/users/:id` (users.show)    | `UsersController.show`           | `auth, permission` |
| PUT    | `/users/:id` (users.update)  | `UsersController.update`         | `auth, permission` |
| PATCH  | `/users/:id` (users.update)  | `UsersController.update`         | `auth, permission` |
| DELETE | `/users/:id` (users.destroy) | `UsersController.destroy`        | `auth, permission` |
| POST   | `/users/:id/roles`           | `UsersController.assignRoles`    | `auth, permission` |
| DELETE | `/users/:id/roles/:roleId`   | `UsersController.removeRole`     | `auth, permission` |
| GET    | `/users/:id/roles`           | `UsersController.getUserRoles`   | `auth, permission` |

---

## 🏫 Institutes
| Method | Route              | Handler                        | Middleware         |
|--------|--------------------|--------------------------------|--------------------|
| GET    | `/institutes`      | `InstitutesController.index`   | `auth, permission` |
| POST   | `/institutes`      | `InstitutesController.store`   | `auth, permission` |
| GET    | `/institutes/:id`  | `InstitutesController.show`    | `auth, permission` |
| PUT    | `/institutes/:id`  | `InstitutesController.update`  | `auth, permission` |
| DELETE | `/institutes/:id`  | `InstitutesController.destroy` | `auth, permission` |

---

## 🏢 Departments
| Method | Route                 | Handler                          | Middleware         |
|--------|-----------------------|----------------------------------|--------------------|
| GET    | `/departments`        | `DepartmentsController.index`    | `auth, permission` |
| POST   | `/departments`        | `DepartmentsController.store`    | `auth, permission` |
| GET    | `/departments/:id`    | `DepartmentsController.show`     | `auth, permission` |
| PUT    | `/departments/:id`    | `DepartmentsController.update`   | `auth, permission` |
| DELETE | `/departments/:id`    | `DepartmentsController.destroy`  | `auth, permission` |

---

## 🎓 Faculty Management
| Method | Route             | Handler                        | Middleware         |
|--------|------------------|--------------------------------|--------------------|
| GET    | `/faculty`        | `FacultiesController.index`    | `auth, permission` |
| POST   | `/faculty`        | `FacultiesController.store`    | `auth, permission` |
| GET    | `/faculty/:id`    | `FacultiesController.show`     | `auth, permission` |
| PUT    | `/faculty/:id`    | `FacultiesController.update`   | `auth, permission` |
| DELETE | `/faculty/:id`    | `FacultiesController.destroy`  | `auth, permission` |
