# 🔐 Enterprise RBAC + Permission-Based UI System

## Complete Implementation Guide

> **Build Date:** February 2026  
> **Level:** Production-Ready Enterprise Application  
> **Framework:** Node.js + Express (Backend) | Vanilla JavaScript (Frontend)

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Security Considerations](#security-considerations)
7. [Best Practices](#best-practices)
8. [Examples & Usage](#examples--usage)
9. [Testing & Debugging](#testing--debugging)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

### What is RBAC?

**Role-Based Access Control (RBAC)** is a security model where permissions are assigned to user roles rather than directly to users. This provides:

- **Scalability** - Manage permissions at scale
- **Maintainability** - Easy to audit and modify access
- **Flexibility** - Create custom roles as needed
- **Security** - Follows enterprise security best practices

### Key Components

| Component | Purpose |
|-----------|---------|
| **Permissions** | Atomic, granular permission definitions (e.g., "user:create") |
| **Roles** | Groups of permissions assigned to users |
| **Users** | Individual system users with assigned roles |
| **Scope** | Branch/Enterprise constraints on access |

---

## Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     USER LOGIN                              │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│         FETCH ROLE + PERMISSIONS                            │
│    (From user's atomicRole reference)                       │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│    RETURN IN LOGIN RESPONSE                                 │
│  - user data                                                │
│  - permissions array                                        │
│  - access token                                             │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND STORES IN LOCALSTORAGE                            │
│  authData = {                                               │
│    user: {...},                                             │
│    permissions: ["user:create", "asset:read", ...],        │
│    accessToken: "jwt...",                                   │
│  }                                                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│     UI CONTROL LAYER                                        │
│  - Show/Hide elements based on permissions                  │
│  - Enable/Disable buttons                                   │
│  - Render conditional sections                             │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│     API REQUEST WITH TOKEN                                  │
│  Authorization: Bearer <accessToken>                        │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│     BACKEND AUTHORIZATION (CRITICAL!)                       │
│  1. Verify JWT token + extract user                         │
│  2. Populate user permissions from role                     │
│  3. Check permission: hasPermission(req.user.permissions)   │
│  4. Check scope: Can user access this branch/enterprise?    │
│  5. Execute action OR return 403 Forbidden                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### 1. **Permission Model**

```javascript
{
  _id: ObjectId,
  key: "user:create",              // Unique identifier
  description: "Create new users",
  category: "user_management",     // For grouping
  isSystemPermission: false,        // Critical Operation?
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

**Location:** `Backend/src/models/permission.model.js`

---

### 2. **AtomicRole Model**

```javascript
{
  _id: ObjectId,
  name: "super_admin",             // Unique, lowercase
  displayName: "Super Administrator",
  description: "Full system access",
  category: "system",              // 'system' = protected
  permissions: [                   // Array of permission keys
    "*"                            // Wildcard = all permissions
  ],
  organizationId: null,            // null = system role
  priority: 1,                     // Higher = more privileged
  canManageMultipleBranches: true,
  canManageMultipleEnterprises: true,
  isActive: true,
  isProtected: true,               // Cannot be deleted
  createdAt: Date,
  updatedAt: Date
}
```

**Location:** `Backend/src/models/atomicRole.model.js`

---

### 3. **User Model Updates**

```javascript
{
  // Existing fields...
  userId: String,
  name: String,
  email: String,
  
  // NEW RBAC fields
  atomicRoleId: {                  // Reference to AtomicRole
    type: ObjectId,
    ref: 'AtomicRole'
  },
  permissions: [String],           // Denormalized from role
  
  // Scope fields
  organizationId: ObjectId,        // Which enterprise?
  branchId: [ObjectId],            // Which branches?
  
  // Status
  canLogin: Boolean,
  isActive: Boolean,
  isBlocked: Boolean
}
```

---

## Backend Implementation

### 1. Database Initialization (Seed Data)

**Run once on application startup:**

```javascript
// In your main app.js or database initialization file
import { seedRBAC } from "./seed/rbac.seed.js";

// After database connection
await seedRBAC();
```

**What This Does:**
- Creates 37 atomic permissions across 7 categories
- Creates 4 built-in roles (SUPER_ADMIN, ENTERPRISE_ADMIN, BRANCH_ADMIN, USER)
- Assigns permissions to roles

---

### 2. Authentication Middleware

**File:** `Backend/src/middlewares/auth.middleware.js`

```javascript
import { verifyJWT, populatePermissions } from "./middlewares/auth.middleware.js";

// Use in your routes
router.get("/protected-route", 
  verifyJWT,              // Verify JWT and attach user
  populatePermissions,    // Load permissions from role
  (req, res) => {
    // req.user now has:
    // - id, name, email, role, etc.
    // - permissions: ["user:create", "asset:read", ...]
  }
);
```

---

### 3. Authorization Middleware

**File:** `Backend/src/middlewares/authorizationMiddleware.js`

#### Single Permission Check

```javascript
import { checkPermission } from "./middlewares/authorizationMiddleware.js";

// Require exactly one permission
router.post("/users",
  verifyJWT,
  populatePermissions,
  checkPermission("user:create"),  // Returns 403 if missing
  async (req, res) => {
    // User has "user:create" permission or is SUPER_ADMIN
  }
);
```

#### Multiple Permissions (OR Logic)

```javascript
// User needs ANY of these permissions
router.post("/reports/export",
  verifyJWT,
  populatePermissions,
  checkPermission(["report:export", "audit:export"]),
  (req, res) => { }
);
```

#### Multiple Permissions (AND Logic)

```javascript
import { checkAllPermissions } from "./middlewares/authorizationMiddleware.js";

// User needs ALL of these permissions
router.post("/users/bulk-import",
  verifyJWT,
  populatePermissions,
  checkAllPermissions(["user:create", "user:import"]),
  (req, res) => { }
);
```

#### Scope + Permission Check

```javascript
import { checkScopePermission } from "./middlewares/authorizationMiddleware.js";

// User must have permission AND access to branch
router.post("/assets",
  verifyJWT,
  populatePermissions,
  checkScopePermission("asset:create", {
    branchField: "branchId",
    enterpriseField: "organizationId"
  }),
  (req, res) => {
    // User has permission AND is assigned to the branch
  }
);
```

---

### 4. Permission Utility Functions

**File:** `Backend/src/utils/permissionUtils.js`

```javascript
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  checkScopeAccess,
  getUserPermissions
} from "./utils/permissionUtils.js";

// In your route handlers or services:

// Check single permission
if (hasPermission(user.permissions, "user:delete")) {
  // Allow deletion
}

// Check multiple (OR)
if (hasAnyPermission(user.permissions, ["report:export", "audit:export"])) {
  // Allow export
}

// Check multiple (AND)
if (hasAllPermissions(user.permissions, ["user:create", "user:assign_role"])) {
  // Allow bulk user creation with role assignment
}

// Check scope access
if (checkScopeAccess(user, branchId, enterpriseId)) {
  // User can access resources in this scope
}
```

---

## Frontend Implementation

### 1. Permission Helper (`permissionHelper.js`)

**File:** `Frontend/src/utils/permissionHelper.js`

```javascript
import {
  hasPermission,
  hasAnyPermission,
  getCurrentUser,
  isSuperAdmin,
  getAccessToken
} from "./utils/permissionHelper.js";

// Check permission
if (hasPermission("user:create")) {
  // Show "Add User" button
}

// Check multiple (OR)
if (hasAnyPermission(["report:export", "audit:export"])) {
  // Show export button
}

// Check if Super Admin
if (isSuperAdmin()) {
  // Show admin panel
}
```

---

### 2. UI Control Layer (`permissionUIController.js`)

**File:** `Frontend/src/utils/permissionUIController.js`

#### Auto-Hide Elements Based on Permissions

```html
<!-- This button only shows if user has "user:create" permission -->
<button data-permission="user:create">
  ➕ Add New User
</button>

<!-- Multiple permissions (OR logic) - show if user has ANY -->
<button data-permission="report:export|audit:export">
  📥 Export
</button>

<!-- Multiple permissions (AND logic) - show if user has ALL -->
<button data-permission="user:create&user:import">
  📥 Bulk Import
</button>
```

**JavaScript:**

```javascript
import { initPermissionControls } from "./utils/permissionUIController.js";

// Call on page load
document.addEventListener("DOMContentLoaded", () => {
  initPermissionControls(); // Hides/shows elements based on permissions
});
```

**What It Does:**
- Automatically hides elements tagged with `[data-permission]` if user lacks permission
- Disables buttons if permission is missing
- Shows admin-only sections only for Super Admin

#### Conditional Rendering

```javascript
import { executeIfPermitted } from "./utils/permissionUIController.js";

const deleteBtn = document.getElementById("deleteBtn");
deleteBtn.addEventListener("click", () => {
  executeIfPermitted(
    "user:delete",
    () => {
      // Permission granted - execute delete
      console.log("Deleting...");
    },
    () => {
      // Permission denied - show error
      alert("You don't have permission to delete users");
    }
  );
});
```

---

### 3. Storing Permissions After Login

```javascript
// After successful login, store permissions in localStorage
import { setAuthData } from "./utils/permissionHelper.js";

// API response from backend
const loginResponse = {
  user: { id: "123", name: "John", ... },
  permissions: ["user:create", "asset:read", ...],
  accessToken: "jwt...",
  refreshToken: "refresh..."
};

// Store in localStorage
setAuthData(loginResponse);

// Frontend can now check permissions with hasPermission()
```

---

## Security Considerations

### ⚠️ CRITICAL: Frontend UI is NOT Security

**Frontend permission checks (hiding buttons, disabling fields) provide UX only.**

```
❌ WRONG: Trusting frontend permission checks for security
✅ CORRECT: Always validate on backend
```

### Backend Authorization Rules

1. **ALWAYS verify JWT token first**
   ```javascript
   verifyJWT → Validates token signature & expiry
   ```

2. **ALWAYS check permission after extracting user**
   ```javascript
   checkPermission("action:permission") → Returns 403 if missing
   ```

3. **ALWAYS check scope (branch/enterprise)**
   ```javascript
   checkScopeAccess(user, branchId, enterpriseId)
   ```

### Example Secure Route

```javascript
router.delete("/users/:id",
  // Step 1: Verify authentication
  verifyJWT,
  
  // Step 2: Populate permissions
  populatePermissions,
  
  // Step 3: Check authorization (CRITICAL)
  checkPermission("user:delete"),
  
  // Step 4: Business logic
  async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    
    // Step 5: Verify scope access
    const targetUser = await User.findById(id);
    if (!checkScopeAccess(user, targetUser.branchId)) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Step 6: Perform action
    await User.findByIdAndDelete(id);
  }
);
```

---

## Best Practices

### 1. **Atomic Permission Naming**

✅ Good:
```
user:create
user:update
user:delete
asset:transfer
report:export
```

❌ Bad:
```
admin
can_edit_users
full_access
```

### 2. **Role Hierarchy**

System roles by priority:
- **SUPER_ADMIN** (Priority 1): "*" (all permissions)
- **ENTERPRISE_ADMIN** (Priority 2): Manage enterprise + branches
- **BRANCH_ADMIN** (Priority 3): Manage single/multiple branches
- **USER** (Priority 100): Basic read + own profile update

### 3. **Scope Management**

Always enforce:
```javascript
// Check if resource belongs to user's organization
checkEnterpriseAccess(user, resource.organizationId)

// Check if resource belongs to user's branch
checkBranchAccess(user, resource.branchId)
```

### 4. **Audit Logging**

Log all permission checks for compliance:
```javascript
import { auditPermissionCheck } from "./middlewares/authorizationMiddleware.js";

router.delete("/users/:id",
  verifyJWT,
  auditPermissionCheck,  // Logs permission check
  checkPermission("user:delete"),
  deleteUserHandler
);
```

### 5. **Error Handling**

Always return clear error messages:
```javascript
// Frontend can display to user
res.status(403).json({
  success: false,
  message: "Permission required: user:delete",
  requiredPermission: "user:delete",
  userPermissions: req.user.permissions
});
```

---

## Examples & Usage

### Example 1: User Management Page

```html
<div id="userManagement">
  <!-- Add button - only if user has permission -->
  <button id="addBtn" data-permission="user:create">
    ➕ Add User
  </button>
  
  <!-- Users table -->
  <table data-permission="user:read">
    <tr>
      <td>John Doe</td>
      <!-- Edit button - only if user has permission -->
      <td>
        <button data-permission="user:update">✏️ Edit</button>
        <button data-permission="user:delete">🗑️ Delete</button>
      </td>
    </tr>
  </table>
</div>

<script type="module">
import { initPermissionControls } from "./permissionUIController.js";

document.addEventListener("DOMContentLoaded", () => {
  initPermissionControls();
});
</script>
```

### Example 2: Protected API Endpoint

```javascript
// Backend route: Create User
router.post("/users",
  verifyJWT,
  populatePermissions,
  checkPermission("user:create"),
  asyncHandler(async (req, res) => {
    const { name, email, branchId } = req.body;
    
    // Check scope
    if (!checkScopeAccess(req.user, branchId)) {
      throw new apiError(403, "Cannot create user in this branch");
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      branchId,
      organizationId: req.user.organizationId
    });
    
    res.status(201).json(new apiResponse(user, "User created"));
  })
);
```

### Example 3: Checking Multiple Permissions

```javascript
// Frontend: Show export button only if user can export
if (hasAnyPermission(["report:export", "audit:export"])) {
  renderExportButton();
}

// Backend: Require all permissions
router.post("/reports/advanced-export",
  verifyJWT,
  populatePermissions,
  checkAllPermissions(["report:generate", "report:export"]),
  advancedExportHandler
);
```

---

## Testing & Debugging

### 1. Check Current Permissions

```javascript
import { getCurrentUserPermissions, showPermissionMatrix } from "./permissionHelper.js";

// In browser console:
getCurrentUserPermissions();
// Output: ["user:create", "user:update", "asset:read", ...]

showPermissionMatrix();
// Shows table of all permissions and whether user has each
```

### 2. Test Permission Checks

```javascript
import { hasPermission } from "./permissionHelper.js";

// Test various permissions
console.log(hasPermission("user:create"));     // true/false
console.log(hasPermission("user:delete"));     // true/false
console.log(hasPermission("system:admin"));    // true/false
```

### 3. Backend Permission Logging

```javascript
// Enable audit logging
router.use(auditPermissionCheck);

// All permission checks will be logged to console:
// {
//   timestamp: "2026-02-19T10:30:00Z",
//   userId: "user123",
//   checkedPermission: "user:create",
//   statusCode: 200,
//   path: "/users"
// }
```

---

## Troubleshooting

### ❌ Problem: Buttons showing but user shouldn't see them

**Cause:** Frontend UI hiding is working, but backend isn't validating

**Solution:**
```javascript
// NOT ENOUGH:
if (hasPermission("user:delete")) {
  showDeleteButton();
}

// CORRECT:
// 1. Show button only if user has permission (UX)
if (hasPermission("user:delete")) {
  showDeleteButton();
}

// 2. Backend MUST also check (SECURITY)
router.delete("/users/:id",
  verifyJWT,
  populatePermissions,
  checkPermission("user:delete"),  // REQUIRED
  handler
);
```

### ❌ Problem: "Permission denied" error on API call

**Cause:** User permissions not populated in JWT or backend

**Solution:**
```javascript
// Make sure to include populatePermissions middleware
router.post("/action",
  verifyJWT,
  populatePermissions,  // DON'T FORGET THIS
  checkPermission("action:perform"),
  handler
);
```

### ❌ Problem: permissions array is empty

**Cause:** User doesn't have atomicRole assigned

**Solution:**
```javascript
// Check if user has role assigned
const user = await User.findById(userId).populate("atomicRole");
if (!user.atomicRole) {
  // Assign default role
  user.atomicRoleId = defaultRoleId;
  await user.save();
}
```

### ❌ Problem: Super Admin seeing "Permission denied"

**Cause:** "*" wildcard not being checked

**Solution:**
```javascript
// Verify permission check includes wildcard
export const hasPermission = (userPermissions, requiredPermission) => {
  // Check wildcard FIRST
  if (userPermissions.includes("*")) return true;  // ← REQUIRED
  
  // Then check exact match
  return userPermissions.includes(requiredPermission);
};
```

---

## File Structure

```
ABCD 1.1.0/
├── Backend/
│   └── src/
│       ├── models/
│       │   ├── permission.model.js          [NEW]
│       │   ├── atomicRole.model.js          [NEW]
│       │   └── user.model.js                [UPDATED]
│       ├── middlewares/
│       │   ├── auth.middleware.js           [UPDATED]
│       │   └── authorizationMiddleware.js   [NEW]
│       ├── routes/
│       │   └── rbac.routes.js               [NEW - Examples]
│       ├── services/
│       │   └── auth.service.js              [UPDATED]
│       ├── utils/
│       │   └── permissionUtils.js           [NEW]
│       └── seed/
│           └── rbac.seed.js                 [NEW]
└── Frontend/
    └── src/
        ├── utils/
        │   ├── permissionHelper.js          [NEW]
        │   └── permissionUIController.js    [NEW]
        └── pages/
            └── users/
                └── UserManagementRBAC.jsx   [NEW - Example]
```

---

## Next Steps

1. **Initialize RBAC System**
   ```bash
   # Run seed on startup
   npm run seed:rbac
   ```

2. **Assign Roles to Users**
   ```javascript
   // Update existing users
   user.atomicRoleId = branchAdminRole._id;
   await user.save();
   ```

3. **Add Permission Checks to Routes**
   - Start with critical operations (delete, disable)
   - Then move to create/update
   - Finally read operations

4. **Test End-to-End**
   - Login as different roles
   - Verify UI reflects permissions
   - Verify backend blocks unauthorized access

5. **Enable Audit Logging**
   - Log all permission checks
   - Monitor for suspicious access patterns

---

## Support & Documentation

- **Models:** See schema comments in model files
- **Seed Data:** Check `rbac.seed.js` for all permissions
- **Routes:** Example endpoints in `rbac.routes.js`
- **Frontend:** UI helpers in `permissionUIController.js`

---

**Built with ❤️ for Enterprise Applications**
