import { hasPermission, checkScopeAccess } from "../utils/permissionUtils.js";
import { apiError } from "../utils/apiError.js";

/**
 * Authorization Middleware Factory
 * Creates middleware for permission checking
 */

/**
 * Check if user has required permission
 * @param {string|Array<string>} requiredPermissions - Permission key(s) required
 * @param {Object} options - Configuration options
 * @returns {Function} - Express middleware
 */
export const checkPermission = (requiredPermissions, options = {}) => {
  return (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: "Authentication required",
        });
      }

      // Get user permissions
      const userPermissions = req.user.permissions || [];

      // Handle array of permissions (check if user has ANY of them)
      if (Array.isArray(requiredPermissions)) {
        const hasAny = requiredPermissions.some((perm) =>
          hasPermission(userPermissions, perm)
        );

        if (!hasAny) {
          return res.status(403).json({
            success: false,
            statusCode: 403,
            message: `Insufficient permissions. Required: ${requiredPermissions.join(
              " | "
            )}`,
          });
        }
      } else {
        // Single permission check
        if (!hasPermission(userPermissions, requiredPermissions)) {
          return res.status(403).json({
            success: false,
            statusCode: 403,
            message: `Permission '${requiredPermissions}' required`,
          });
        }
      }

      // Attach checked permission to request for logging/audit
      req.checkedPermission = requiredPermissions;

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: error.message,
      });
    }
  };
};

/**
 * Check if user has ALL required permissions
 * @param {Array<string>} requiredPermissions - All permissions required
 * @returns {Function} - Express middleware
 */
export const checkAllPermissions = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: "Authentication required",
        });
      }

      const userPermissions = req.user.permissions || [];

      const hasAll = requiredPermissions.every((perm) =>
        hasPermission(userPermissions, perm)
      );

      if (!hasAll) {
        return res.status(403).json({
          success: false,
          statusCode: 403,
          message: `Insufficient permissions. Required all of: ${requiredPermissions.join(
            ", "
          )}`,
        });
      }

      req.checkedPermission = requiredPermissions;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: error.message,
      });
    }
  };
};

/**
 * Check scope access (branch + enterprise + permission)
 * @param {string} permissionKey - Permission to check
 * @param {Object} options - { branchField, enterpriseField }
 * @returns {Function} - Express middleware
 */
export const checkScopePermission = (permissionKey, options = {}) => {
  const { branchField = "branchId", enterpriseField = "organizationId" } = options;

  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: "Authentication required",
        });
      }

      const userPermissions = req.user.permissions || [];

      // Check permission
      if (!hasPermission(userPermissions, permissionKey)) {
        return res.status(403).json({
          success: false,
          statusCode: 403,
          message: `Permission '${permissionKey}' required`,
        });
      }

      // Get resource scope from request body/params/query
      const resourceBranchId =
        req.body?.[branchField] ||
        req.params?.[branchField] ||
        req.query?.[branchField];

      const resourceEnterpriseId =
        req.body?.[enterpriseField] ||
        req.params?.[enterpriseField] ||
        req.query?.[enterpriseField];

      // Check scope access
      if (
        !checkScopeAccess(req.user, resourceBranchId, resourceEnterpriseId)
      ) {
        return res.status(403).json({
          success: false,
          statusCode: 403,
          message: "Access to this resource scope is not allowed",
        });
      }

      req.checkedPermission = permissionKey;
      req.resourceBranchId = resourceBranchId;
      req.resourceEnterpriseId = resourceEnterpriseId;

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: error.message,
      });
    }
  };
};

/**
 * Optional: Check if user is admin (has certain admin permissions)
 * Used as a quick check for admin-only routes
 * @returns {Function} - Express middleware
 */
export const verifyRoleBasedAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Authentication required",
      });
    }

    const userPermissions = req.user.permissions || [];

    // Check if user is admin (has wildcard or admin-related permissions)
    const isAdmin =
      userPermissions.includes("*") ||
      userPermissions.includes("user:create") ||
      userPermissions.includes("user:delete");

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: "Admin access required",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message,
    });
  }
};

/**
 * Audit middleware - Log permission checks for compliance/security
 * @returns {Function} - Express middleware
 */
export const auditPermissionCheck = (req, res, next) => {
  // Intercept response to log permission check
  const originalSend = res.send;

  res.send = function (data) {
    // Log permission check details
    console.log({
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      userRole: req.user?.role,
      checkedPermission: req.checkedPermission,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      resourceBranchId: req.resourceBranchId,
      resourceEnterpriseId: req.resourceEnterpriseId,
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Safe permission check (doesn't throw 403, just attaches flag)
 * Useful for UI-level permission checks
 * @param {string|Array<string>} requiredPermissions - Permission(s) to check
 * @returns {Function}
 */
export const attachPermissionCheck = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        req.hasPermission = false;
        return next();
      }

      const userPermissions = req.user.permissions || [];

      if (Array.isArray(requiredPermissions)) {
        req.hasPermission = requiredPermissions.some((perm) =>
          hasPermission(userPermissions, perm)
        );
      } else {
        req.hasPermission = hasPermission(
          userPermissions,
          requiredPermissions
        );
      }

      next();
    } catch (error) {
      req.hasPermission = false;
      next();
    }
  };
};
