/**
 * RBAC Seed Data  
 * Initialize permissions and roles in the system
 * 
 * This file should be run once on application startup or during system setup
 */

import { Permission } from "../models/permission.model.js";
import { AtomicRole } from "../models/atomicRole.model.js";
import { apiError } from "../utils/apiError.js";

// =====================================================
// ALL ATOMIC PERMISSIONS
// =====================================================

export const PERMISSIONS = [
  // ===== USER MANAGEMENT =====
  {
    key: "user:create",
    description: "Create new user accounts",
    category: "user_management",
    isSystemPermission: false,
  },
  {
    key: "user:read",
    description: "View user details and profiles",
    category: "user_management",
    isSystemPermission: false,
  },
  {
    key: "user:update",
    description: "Update user information (name, email, designation, etc.)",
    category: "user_management",
    isSystemPermission: false,
  },
  {
    key: "user:delete",
    description: "Delete user accounts",
    category: "user_management",
    isSystemPermission: true,
  },
  {
    key: "user:disable",
    description: "Disable/enable user accounts",
    category: "user_management",
    isSystemPermission: true,
  },
  {
    key: "user:change_password",
    description: "Set or reset user passwords",
    category: "user_management",
    isSystemPermission: true,
  },
  {
    key: "user:assign_role",
    description: "Assign or change user roles",
    category: "user_management",
    isSystemPermission: true,
  },
  {
    key: "user:assign_branch",
    description: "Assign user to branches",
    category: "user_management",
    isSystemPermission: false,
  },
  {
    key: "user:import",
    description: "Bulk import users",
    category: "user_management",
    isSystemPermission: false,
  },

  // ===== ASSET MANAGEMENT =====
  {
    key: "asset:create",
    description: "Create/add new assets to the system",
    category: "asset_management",
    isSystemPermission: false,
  },
  {
    key: "asset:read",
    description: "View asset details and lists",
    category: "asset_management",
    isSystemPermission: false,
  },
  {
    key: "asset:update",
    description: "Update asset information",
    category: "asset_management",
    isSystemPermission: false,
  },
  {
    key: "asset:delete",
    description: "Delete assets from system",
    category: "asset_management",
    isSystemPermission: true,
  },
  {
    key: "asset:assign",
    description: "Assign assets to users",
    category: "asset_management",
    isSystemPermission: false,
  },
  {
    key: "asset:transfer",
    description: "Transfer assets between users/branches",
    category: "asset_management",
    isSystemPermission: false,
  },
  {
    key: "asset:deprecate",
    description: "Mark assets as deprecated",
    category: "asset_management",
    isSystemPermission: false,
  },
  {
    key: "asset:import",
    description: "Bulk import assets",
    category: "asset_management",
    isSystemPermission: false,
  },

  // ===== REPORTING =====
  {
    key: "report:view",
    description: "View reports and dashboards",
    category: "reporting",
    isSystemPermission: false,
  },
  {
    key: "report:export",
    description: "Export reports to CSV/Excel",
    category: "reporting",
    isSystemPermission: false,
  },
  {
    key: "report:generate",
    description: "Generate custom reports",
    category: "reporting",
    isSystemPermission: false,
  },
  {
    key: "report:schedule",
    description: "Schedule automated reports",
    category: "reporting",
    isSystemPermission: false,
  },

  // ===== ORGANIZATION =====
  {
    key: "organization:create",
    description: "Create new organizations/enterprises",
    category: "organization",
    isSystemPermission: true,
  },
  {
    key: "organization:read",
    description: "View organization details",
    category: "organization",
    isSystemPermission: false,
  },
  {
    key: "organization:update",
    description: "Update organization settings",
    category: "organization",
    isSystemPermission: true,
  },
  {
    key: "organization:delete",
    description: "Delete organizations",
    category: "organization",
    isSystemPermission: true,
  },

  // ===== BRANCH =====
  {
    key: "branch:create",
    description: "Create new branches",
    category: "branch",
    isSystemPermission: false,
  },
  {
    key: "branch:read",
    description: "View branch details",
    category: "branch",
    isSystemPermission: false,
  },
  {
    key: "branch:update",
    description: "Update branch information",
    category: "branch",
    isSystemPermission: false,
  },
  {
    key: "branch:delete",
    description: "Delete branches",
    category: "branch",
    isSystemPermission: true,
  },

  // ===== SYSTEM ADMIN =====
  {
    key: "system:admin",
    description: "Full system administration access",
    category: "system_admin",
    isSystemPermission: true,
  },
  {
    key: "system:configure",
    description: "Configure system settings",
    category: "system_admin",
    isSystemPermission: true,
  },
  {
    key: "system:audit",
    description: "Access system audit logs",
    category: "system_admin",
    isSystemPermission: true,
  },

  // ===== AUDIT =====
  {
    key: "audit:view",
    description: "View audit logs and activity history",
    category: "audit",
    isSystemPermission: false,
  },
  {
    key: "audit:export",
    description: "Export audit logs",
    category: "audit",
    isSystemPermission: false,
  },
];

// =====================================================
// BUILT-IN ROLES
// =====================================================

export const BUILT_IN_ROLES = [
  {
    name: "super_admin",
    displayName: "Super Administrator",
    description: "Full system access - can manage everything",
    category: "system",
    priority: 1,
    permissions: ["*"], // Wildcard - all permissions
    isActive: true,
    isProtected: true,
    canManageMultipleBranches: true,
    canManageMultipleEnterprises: true,
  },
  {
    name: "enterprise_admin",
    displayName: "Enterprise Administrator",
    description: "Can manage assigned enterprises and their branches",
    category: "system",
    priority: 2,
    permissions: [
      "user:create",
      "user:read",
      "user:update",
      "user:disable",
      "user:assign_role",
      "user:assign_branch",
      "asset:create",
      "asset:read",
      "asset:update",
      "asset:assign",
      "asset:transfer",
      "branch:read",
      "branch:create",
      "branch:update",
      "report:view",
      "report:export",
      "audit:view",
    ],
    isActive: true,
    isProtected: true,
    canManageMultipleBranches: true,
    canManageMultipleEnterprises: false,
  },
  {
    name: "branch_admin",
    displayName: "Branch Administrator",
    description: "Can manage assigned branch(es) and users within those branch(es)",
    category: "system",
    priority: 3,
    permissions: [
      "user:create",
      "user:read",
      "user:update",
      "user:disable",
      "asset:create",
      "asset:read",
      "asset:update",
      "asset:assign",
      "asset:transfer",
      "report:view",
      "report:export",
      "audit:view",
    ],
    isActive: true,
    isProtected: true,
    canManageMultipleBranches: true,
    canManageMultipleEnterprises: false,
  },
  {
    name: "user",
    displayName: "Regular User",
    description: "Can view assets and update own profile",
    category: "system",
    priority: 100,
    permissions: ["asset:read", "user:read", "report:view"],
    isActive: true,
    isProtected: true,
    canManageMultipleBranches: false,
    canManageMultipleEnterprises: false,
  },
];

// =====================================================
// SEED FUNCTIONS
// =====================================================

/**
 * Seed all permissions into database
 * Checks for existing permissions to avoid duplicates
 */
export const seedPermissions = async () => {
  try {
    console.log("🌱 Starting permission seed...");

    for (const permission of PERMISSIONS) {
      const exists = await Permission.findOne({ key: permission.key });

      if (!exists) {
        await Permission.create(permission);
        console.log(`✅ Created permission: ${permission.key}`);
      } else {
        console.log(`⏭️  Permission already exists: ${permission.key}`);
      }
    }

    console.log(`✨ Permission seeding complete. Total: ${PERMISSIONS.length}`);
    return true;
  } catch (error) {
    console.error("❌ Error seeding permissions:", error.message);
    throw error;
  }
};

/**
 * Seed all built-in roles into database
 * Checks for existing roles to avoid duplicates
 */
export const seedRoles = async () => {
  try {
    console.log("🌱 Starting role seed...");

    for (const role of BUILT_IN_ROLES) {
      const exists = await AtomicRole.findOne({ name: role.name });

      if (!exists) {
        await AtomicRole.create(role);
        console.log(`✅ Created role: ${role.name}`);
      } else {
        console.log(`⏭️  Role already exists: ${role.name}`);
      }
    }

    console.log(`✨ Role seeding complete. Total: ${BUILT_IN_ROLES.length}`);
    return true;
  } catch (error) {
    console.error("❌ Error seeding roles:", error.message);
    throw error;
  }
};

/**
 * Run all seed operations
 * This should be called during application startup or as needed
 */
export const seedRBAC = async () => {
  try {
    console.log("\n");
    console.log("═══════════════════════════════════════════════");
    console.log("🔐 RBAC SYSTEM INITIALIZATION");
    console.log("═══════════════════════════════════════════════\n");

    await seedPermissions();
    console.log("\n");
    await seedRoles();

    console.log("\n");
    console.log("═══════════════════════════════════════════════");
    console.log("✅ RBAC INITIALIZATION COMPLETE");
    console.log("═══════════════════════════════════════════════\n");

    return true;
  } catch (error) {
    console.error("\n❌ RBAC Seeding failed:", error);
    throw error;
  }
};

/**
 * Get all permissions (useful for admin panels, role assignment UI)
 */
export const getAllPermissions = async () => {
  try {
    return await Permission.find({ isActive: true }).sort({ category: 1, key: 1 });
  } catch (error) {
    throw new apiError(500, "Error fetching permissions");
  }
};

/**
 * Get permissions grouped by category
 */
export const getPermissionsByCategory = async () => {
  try {
    const permissions = await Permission.find({ isActive: true }).sort({ category: 1, key: 1 });

    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {});

    return grouped;
  } catch (error) {
    throw new apiError(500, "Error fetching permissions by category");
  }
};

/**
 * Get all built-in roles
 */
export const getBuiltInRoles = async () => {
  try {
    return await AtomicRole.find({ category: "system" }).sort({ priority: 1 });
  } catch (error) {
    throw new apiError(500, "Error fetching built-in roles");
  }
};
