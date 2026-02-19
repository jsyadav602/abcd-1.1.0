/**
 * Permission Utility Functions
 * Core logic for checking permissions at runtime
 */

/**
 * Check if user has required permission
 * Rules:
 * - If user has "*" in permissions → ALL permissions granted
 * - If user has exact permission → granted
 * - Otherwise → denied
 *
 * @param {Array<string>} userPermissions - User's permission array
 * @param {string} requiredPermission - Permission to check (e.g., "user:create")
 * @returns {boolean}
 */
export const hasPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }

  // Wildcard check - SUPER_ADMIN has "*"
  if (userPermissions.includes("*")) {
    return true;
  }

  // Exact permission match
  return userPermissions.includes(requiredPermission);
};

/**
 * Check if user has ANY of the required permissions
 * @param {Array<string>} userPermissions - User's permission array
 * @param {Array<string>} requiredPermissions - Array of permissions (OR logic)
 * @returns {boolean}
 */
export const hasAnyPermission = (userPermissions, requiredPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }

  if (userPermissions.includes("*")) {
    return true;
  }

  return requiredPermissions.some((perm) => userPermissions.includes(perm));
};

/**
 * Check if user has ALL required permissions
 * @param {Array<string>} userPermissions - User's permission array
 * @param {Array<string>} requiredPermissions - Array of permissions (AND logic)
 * @returns {boolean}
 */
export const hasAllPermissions = (userPermissions, requiredPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }

  if (userPermissions.includes("*")) {
    return true;
  }

  return requiredPermissions.every((perm) => userPermissions.includes(perm));
};

/**
 * Get permissions for a user from their role
 * Resolves role reference and extracts permissions
 *
 * @param {Object} user - User object with roleId/role populated
 * @returns {Array<string>} - Array of permission keys
 */
export const getUserPermissions = (user) => {
  if (!user) return [];

  // If permissions are directly on user (pre-populated)
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions;
  }

  // If role is populated
  if (user.role && typeof user.role === "object" && user.role.permissions) {
    return user.role.permissions;
  }

  // If roleId is populated with atomic role
  if (user.atomicRole && typeof user.atomicRole === "object" && user.atomicRole.permissions) {
    return user.atomicRole.permissions;
  }

  return [];
};

/**
 * Check scope access (branch/enterprise)
 * Returns true if user can access the specific scope
 *
 * @param {Object} user - User object
 * @param {string|ObjectId} resourceBranchId - Branch ID of the resource
 * @param {string|ObjectId} resourceEnterpriseId - Enterprise ID of the resource
 * @returns {boolean}
 */
export const checkScopeAccess = (user, resourceBranchId, resourceEnterpriseId) => {
  if (!user) return false;

  // SUPER_ADMIN can access any resource
  if (user.permissions?.includes("*")) {
    return true;
  }

  // Check enterprise access
  if (resourceEnterpriseId) {
    const userEnterpriseIds = Array.isArray(user.organizationId)
      ? [user.organizationId.toString()]
      : user.organizationId
        ? [user.organizationId.toString()]
        : [];

    if (userEnterpriseIds.length > 0) {
      if (!userEnterpriseIds.includes(resourceEnterpriseId.toString())) {
        return false;
      }
    }
  }

  // Check branch access
  if (resourceBranchId) {
    const userBranchIds = (user.branchId || []).map((id) => id.toString());

    if (userBranchIds.length > 0) {
      if (!userBranchIds.includes(resourceBranchId.toString())) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Get user's accessible branches
 * @param {Object} user - User object
 * @returns {Array<ObjectId>}
 */
export const getUserAccessibleBranches = (user) => {
  if (!user) return [];

  // SUPER_ADMIN has access to all branches
  if (user.permissions?.includes("*")) {
    return ["*"]; // Wildcard indicates all branches
  }

  return (user.branchId || []).map((id) => id.toString());
};

/**
 * Get user's accessible enterprises
 * @param {Object} user - User object
 * @returns {Array<ObjectId>}
 */
export const getUserAccessibleEnterprises = (user) => {
  if (!user) return [];

  // SUPER_ADMIN has access to all enterprises
  if (user.permissions?.includes("*")) {
    return ["*"]; // Wildcard indicates all enterprises
  }

  const enterprises = Array.isArray(user.organizationId)
    ? user.organizationId
    : user.organizationId
      ? [user.organizationId]
      : [];

  return enterprises.map((id) => id.toString());
};

/**
 * Parse permission string (e.g., "user:create" → {resource: "user", action: "create"})
 * @param {string} permissionKey - Permission key (e.g., "user:create")
 * @returns {Object|null}
 */
export const parsePermission = (permissionKey) => {
  if (!permissionKey || typeof permissionKey !== "string") return null;

  if (permissionKey === "*") {
    return { resource: "*", action: "*", isWildcard: true };
  }

  const parts = permissionKey.split(":");
  if (parts.length !== 2) return null;

  return {
    resource: parts[0],
    action: parts[1],
    isWildcard: false,
  };
};

/**
 * Get all permissions for a resource
 * @param {Array<string>} userPermissions - User's permissions
 * @param {string} resource - Resource name (e.g., "user", "asset")
 * @returns {Array<string>} - Array of actions (e.g., ["create", "update", "delete"])
 */
export const getResourcePermissions = (userPermissions, resource) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return [];
  }

  if (userPermissions.includes("*")) {
    return ["create", "read", "update", "delete", "export", "*"];
  }

  return userPermissions
    .filter((perm) => perm.startsWith(`${resource}:`))
    .map((perm) => perm.split(":")[1]);
};
