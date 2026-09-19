# Users API

This document details the Users management endpoints implemented in the RuralSpark backend.

## Overview
The `UsersController` provides CRUD functionality for Users and specific role-assignment endpoints. Noticeably, some standard resource endpoints (`show`, `update`, `destroy`) are mapped in the routes but currently contain **empty implementations** in the `UsersController`.

All endpoints require the user to be authenticated via the `adminapi` or `api` guards, and have explicit permission checks (e.g. `USERS_VIEW`, `USER_ROLES_ASSIGN`).

---

## GET `/users`

**Purpose**: Fetch a list of all users.
**Authentication**: Authenticated User (Requires `USERS_VIEW` permission)
**Backend Handler**: `UsersController.index` -> `UserService.findAll()`

---

## POST `/users`

**Purpose**: Create a new user and assign them optional roles.
**Authentication**: Authenticated User (Requires `USERS_CREATE` permission)
**Backend Handler**: `UsersController.store` -> `UserService.create()`

### Request
- **Content-Type**: `application/json`
- **Body Fields**:
  - `fullName` (string)
  - `email` (string)
  - `password` (string)
  - `mobile` (string)
  - `roleIds` (array of numbers, optional)

---

## POST `/users/:id/roles`

**Purpose**: Assign a set of roles to a specific user.
**Authentication**: Authenticated User (Requires `USER_ROLES_ASSIGN` permission)

### Request
- **Content-Type**: `application/json`
- **Body Fields**:
  - `roleIds` (array of numbers, required) - Array of role IDs to be attached.

### Errors
- **400 Bad Request**: If `roleIds` is not an array.

---

## DELETE `/users/:id/roles/:roleId`

**Purpose**: Remove a specific role from a specific user.
**Authentication**: Authenticated User (Requires `USER_ROLES_REMOVE` permission)

### Request
- **Path Parameters**:
  - `id`: User ID
  - `roleId`: Role ID

---

## GET `/users/:id/roles`

**Purpose**: Retrieve all roles assigned to a specific user.
**Authentication**: Authenticated User (Requires `USER_ROLES_VIEW` permission)

### Request
- **Path Parameters**:
  - `id`: User ID

---

## ⚠️ Unimplemented Endpoints

The following routes are mapped via `router.resource('users', UsersController)` in `routes.ts`, but the `UsersController` functions for them are currently **empty**:

- **GET `/users/:id`** -> `show()` : **Status: Not Implemented**
- **PUT `/users/:id`** -> `update()` : **Status: Not Implemented**
- **DELETE `/users/:id`** -> `destroy()` : **Status: Not Implemented**
