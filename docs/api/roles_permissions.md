# Roles & Permissions API

This document details the Roles and Permissions endpoints implemented in the RuralSpark backend. 

All endpoints require the user to be authenticated via the `adminapi` or `api` guards, and they implement specific permission checks using middleware (e.g., `PermissionKeys.ROLES_VIEW`).

---

## Roles

Roles manage access levels and are associated with a set of permissions.

### GET `/roles`

**Purpose**: Fetch all roles along with their associated permissions.
**Authentication**: Authenticated User (Requires `ROLES_VIEW` permission)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "role_name": "Admin",
      "role_key": "admin",
      "role_description": "Administrator Role",
      "created_at": "...",
      "updated_at": "...",
      "permissions": [
        {
          "id": 1,
          "permission_name": "View Dashboard",
          "permission_key": "DASHBOARD_VIEW"
        }
      ]
    }
  ],
  "count": 1
}
```

---

### POST `/roles`

**Purpose**: Create a new role and assign permissions to it.
**Authentication**: Authenticated User (Requires `ROLES_CREATE` permission)

#### Request
- **Content-Type**: `application/json`
- **Body Fields**:
  - `roleName` (string, required)
  - `roleKey` (string, required)
  - `roleDescription` (string, optional)
  - `permissionIds` (array of numbers, optional) - List of permission IDs to attach.

#### Response
```json
{
  "success": true,
  "message": "Role created successfully",
  "role": {
    "id": 2,
    "role_name": "Teacher",
    "...": "other role details"
  }
}
```

---

### GET `/roles/:id`

**Purpose**: Retrieve details of a specific role by ID along with its permissions.
**Authentication**: Authenticated User (Requires `ROLES_VIEW` permission)

#### Response
```json
{
  "success": true,
  "data": {
    "id": 2,
    "role_name": "Teacher",
    "permissions": [...]
  }
}
```

---

### PUT `/roles/:id`

**Purpose**: Update an existing role and sync its permissions.
**Authentication**: Authenticated User (Requires `ROLES_UPDATE` permission)

#### Request
- **Content-Type**: `application/json`
- **Body Fields**:
  - `roleName` (string, optional)
  - `roleKey` (string, optional)
  - `roleDescription` (string, optional)
  - `permissionIds` (array of numbers, optional) - Full list of permission IDs to sync. If empty, all permissions are detached.

#### Response
```json
{
  "success": true,
  "message": "Role updated successfully",
  "role": {
    "id": 2,
    "role_name": "Updated Teacher",
    "...": "..."
  }
}
```

---

### DELETE `/roles/:id`

**Purpose**: Delete (soft delete via `deleted_at`) a specific role.
**Authentication**: Authenticated User (Requires `ROLES_DELETE` permission)

#### Response
```json
{
  "status": true,
  "message": "Record deleted successfully",
  "data": null
}
```

---

## Permissions

Permissions are pre-defined actions that can be assigned to roles.

### GET `/permissions`

**Purpose**: Fetch all available permissions.
**Authentication**: Authenticated User (Requires `PERMISSIONS_VIEW` permission)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "permission_name": "Create User",
      "permission_key": "USERS_CREATE",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### GET `/permissions/:id`

**Purpose**: Fetch details of a specific permission by ID.
**Authentication**: Authenticated User (Requires `PERMISSIONS_VIEW` permission)

#### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "permission_name": "Create User",
    "permission_key": "USERS_CREATE",
    "created_at": "...",
    "updated_at": "..."
  }
}
```
