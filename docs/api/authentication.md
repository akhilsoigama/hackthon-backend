# Authentication API

This document details the authentication and permission-related endpoints currently implemented in the RuralSpark backend.

## Overview
Authentication is handled via the `AuthController` using the AdonisJS Auth package. It supports multiple authentication guards (`api`, `adminapi`). It uses cookies (`AUTH_COOKIE_NAME`, typically `token`) as well as headers (`authorization` and `x-access-token`) to manage authentication tokens.

---

## POST `/login`

**Purpose**: Authenticate a user and return an access token.
**Authentication**: Public (Rate Limited)

### Request
- **Content-Type**: `application/json`
- **Body Fields**:
  - `email` (string, required)
  - `password` (string, required)

### Response
```json
{
  "success": true,
  "message": "User login successfully",
  "authType": "<user_type>",
  "token": "<jwt_or_opaque_token>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "...": "other user details"
  }
}
```

### Errors
- **401 Unauthorized**: If no record is found or authentication fails.

---

## GET `/profile`

**Purpose**: Get the profile of the currently logged-in user.
**Authentication**: Authenticated User (Guards: `adminapi`, `api`)

### Request
- **Headers**: `Authorization: Bearer <token>`

### Response
```json
{
  "success": true,
  "authType": "admin | institute | faculty | student | user",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "John Doe",
    "userType": "student",
    "authType": "student",
    "instituteId": 2,
    "facultyId": null,
    "studentId": 5,
    "mobile": "1234567890",
    "isActive": true,
    "isEmailVerified": false,
    "isMobileVerified": false,
    "departmentId": 3,
    "roles": ["student_role"],
    "permissions": ["view_dashboard", "..."],
    "roleName": "Student"
  }
}
```

### Errors
- **401 Unauthorized**: If the user is not authenticated or the user type is unknown.

---

## POST `/logout`

**Purpose**: Logout the currently authenticated user by revoking all access tokens and clearing the auth cookie.
**Authentication**: Authenticated User (Guards: `adminapi`, `api`)

### Request
- **Headers**: `Authorization: Bearer <token>`

### Response
```json
{
  "success": true,
  "message": "User logout successfully"
}
```

### Errors
- **500 Internal Server Error**: If logout fails.

---

## GET `/auth-type`

**Purpose**: Retrieve the `authType` of the logged-in user.
**Authentication**: Authenticated User

### Response
```json
{
  "success": true,
  "authType": "admin | user | institute | faculty | student"
}
```

---

## GET `/my-permissions`

**Purpose**: Retrieve a list of all permission keys assigned to the logged-in user.
**Authentication**: Authenticated User

### Response
```json
{
  "success": true,
  "permissions": ["PERMISSION_1", "PERMISSION_2", "..."]
}
```
*(Admin users will receive `["*"]`)*

---

## POST `/check-permission`

**Purpose**: Check if the logged-in user has a specific permission.
**Authentication**: Authenticated User

### Request
- **Content-Type**: `application/json`
- **Body Fields**:
  - `permissionKey` (string, required)

### Response
```json
{
  "success": true,
  "hasPermission": true,
  "permissionKey": "REQUESTED_PERMISSION_KEY"
}
```

---

## POST `/sync/institutes` | `/sync/faculties` | `/sync/institute` | `/sync/faculty`

**Purpose**: Sync records from the `institutes`, `faculties`, and `students` tables into the central `users` table for unified authentication.
**Authentication**: Public

### Response (e.g. `/sync/institutes`)
```json
{
  "success": true,
  "message": "Successfully synced X institutes to users table",
  "syncedCount": 10,
  "totalInstitutes": 10
}
```
