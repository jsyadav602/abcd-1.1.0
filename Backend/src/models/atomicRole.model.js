import mongoose from "mongoose";

/**
 * Atomic Role Schema - Simplified role system with direct permission references
 * Each role contains an array of permission keys
 *
 * System Roles (built-in, cannot be deleted):
 * - SUPER_ADMIN: Has "*" wildcard permission (all permissions)
 * - ENTERPRISE_ADMIN: Can manage enterprise and branches
 * - BRANCH_ADMIN: Can manage branch-level resources
 * - USER: Limited read and profile update permissions
 */

const atomicRoleSchema = new mongoose.Schema(
  {
    // Unique role name identifier
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 50,
      example: "SUPER_ADMIN, ENTERPRISE_ADMIN, BRANCH_ADMIN, USER",
    },

    // Human-readable display name
    displayName: {
      type: String,
      required: true,
      trim: true,
      example: "Super Administrator",
    },

    // Role description
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      example: "Full system access with all permissions",
    },

    // Role category - System roles are immutable
    category: {
      type: String,
      enum: ["system", "custom"],
      default: "custom",
      note: "system = built-in (super_admin, enterprise_admin, branch_admin, user), custom = user-created",
    },

    // Direct array of permission keys
    // Example: ["user:create", "user:update", "user:delete", "*"]
    // "*" = wildcard for all permissions (only for SUPER_ADMIN)
    permissions: {
      type: [String],
      default: [],
      example: ["user:create", "user:update", "asset:view", "report:view"],
    },

    // Organization scope (null = system-wide)
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      note: "null = system role, otherwise organization-specific role",
    },

    // Role priority (higher = more privileged)
    priority: {
      type: Number,
      default: 100,
      min: 1,
      max: 1000,
      note: "System roles: 1-10, Custom roles: 11-999, Higher = more privileged",
    },

    // Scope constraints
    canManageMultipleBranches: {
      type: Boolean,
      default: false,
      note: "Can this role manage resources in multiple branches?",
    },

    canManageMultipleEnterprises: {
      type: Boolean,
      default: false,
      note: "Can this role manage resources in multiple enterprises?",
    },

    // Role status
    isActive: {
      type: Boolean,
      default: true,
    },

    isProtected: {
      type: Boolean,
      default: false,
      note: "System roles are protected from deletion/modification",
    },

    // Audit fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      note: "User who created this role",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
atomicRoleSchema.index({ category: 1 });
atomicRoleSchema.index({ isActive: 1 });
atomicRoleSchema.index({ organizationId: 1 });
atomicRoleSchema.index({ permissions: 1 });
// Note: name field already has unique: true at schema level, no need to index again

// Middleware to update updatedAt on document modification
atomicRoleSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

/**
 * Check if role has a specific permission
 * @param {string} permission - Permission key to check (e.g., "user:create")
 * @returns {boolean}
 */
atomicRoleSchema.methods.hasPermission = function (permission) {
  if (!this.permissions || this.permissions.length === 0) {
    return false;
  }
  // Check for wildcard or exact permission match
  return this.permissions.includes("*") || this.permissions.includes(permission);
};

/**
 * Add permission to role
 * @param {string|Array<string>} permissions - Permission(s) to add
 */
atomicRoleSchema.methods.addPermissions = function (permissions) {
  const permArray = Array.isArray(permissions) ? permissions : [permissions];
  permArray.forEach((perm) => {
    if (!this.permissions.includes(perm)) {
      this.permissions.push(perm);
    }
  });
};

/**
 * Remove permission from role
 * @param {string|Array<string>} permissions - Permission(s) to remove
 */
atomicRoleSchema.methods.removePermissions = function (permissions) {
  const permArray = Array.isArray(permissions) ? permissions : [permissions];
  this.permissions = this.permissions.filter((perm) => !permArray.includes(perm));
};

/**
 * Get all permissions for this role (excluding wildcard)
 * @returns {Array<string>}
 */
atomicRoleSchema.methods.getExplicitPermissions = function () {
  return this.permissions.filter((perm) => perm !== "*");
};

export const AtomicRole = mongoose.model("AtomicRole", atomicRoleSchema);
