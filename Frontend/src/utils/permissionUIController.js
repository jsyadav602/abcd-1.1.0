/**
 * Permission-Based UI Control Example
 * 
 * This is a vanilla JavaScript example showing how to control UI visibility
 * based on user permissions.
 * 
 * HTML markup with permission-based data attributes combined with
 * JavaScript to dynamically show/hide elements.
 */

import {
  hasPermission,
  hasAnyPermission,
  isSuperAdmin,
  getResourcePermissions,
} from "../utils/permissionHelper.js";

/**
 * Initialize permission-based UI controls
 * Call this on page load
 */
export const initPermissionControls = () => {
  console.log("🔐 Initializing permission controls...");

  // Hide elements that require permissions
  hideElementsWithoutPermissions();

  // Enable/disable buttons based on permissions
  updateButtonStates();

  // Show admin-only sections
  toggleAdminSections();

  // Initialize resource-specific controls
  initializeResourceControls();

  console.log("✅ Permission controls initialized");
};

/**
 * Hide elements that user doesn't have permission for
 * Elements should have data-permission attribute
 */
export const hideElementsWithoutPermissions = () => {
  const permissionElements = document.querySelectorAll(
    "[data-permission], [data-require-permission]"
  );

  permissionElements.forEach((element) => {
    // Support both data-permission and data-require-permission
    const requiredPermission =
      element.dataset.permission || element.dataset.requirePermission;

    if (!requiredPermission) return;

    // Handle multiple permissions with 'any' or 'all' logic
    let hasAccess = false;

    if (requiredPermission.includes("|")) {
      // OR logic: user needs ANY of these permissions
      const permissions = requiredPermission.split("|").map((p) => p.trim());
      hasAccess = hasAnyPermission(permissions);
    } else if (requiredPermission.includes("&")) {
      // AND logic: user needs ALL of these permissions
      const permissions = requiredPermission.split("&").map((p) => p.trim());
      hasAccess = permissions.every((p) => hasPermission(p));
    } else {
      // Single permission
      hasAccess = hasPermission(requiredPermission);
    }

    // Show/Hide element based on access
    if (hasAccess) {
      element.style.display = ""; // Show
      element.classList.add("permission-granted");
      element.classList.remove("permission-denied");
    } else {
      element.style.display = "none"; // Hide
      element.classList.add("permission-denied");
      element.classList.remove("permission-granted");
    }
  });
};

/**
 * Update button disabled states based on permissions
 * Buttons should have data-action attribute
 */
export const updateButtonStates = () => {
  const buttons = document.querySelectorAll("button[data-action]");

  buttons.forEach((button) => {
    const action = button.dataset.action;
    const requiredPermission = button.dataset.requirePermission || action;

    if (!hasPermission(requiredPermission)) {
      button.disabled = true;
      button.classList.add("permission-denied");
      button.title = `Permission required: ${requiredPermission}`;
    } else {
      button.disabled = false;
      button.classList.remove("permission-denied");
      button.title = ""; // Clear the title
    }
  });
};

/**
 * Show/Hide admin-only sections
 * Sections should have data-admin-only attribute
 */
export const toggleAdminSections = () => {
  const adminSections = document.querySelectorAll("[data-admin-only]");

  adminSections.forEach((section) => {
    if (isSuperAdmin()) {
      section.style.display = "";
      section.classList.add("permission-granted");
    } else {
      section.style.display = "none";
      section.classList.add("permission-denied");
    }
  });
};

/**
 * Initialize resource-specific controls
 * Dynamically enable/disable actions for specific resources
 */
export const initializeResourceControls = () => {
  // User Management Actions
  const userActions = document.querySelectorAll("[data-resource='user']");
  userActions.forEach((element) => {
    const action = element.dataset.action;
    const permission = `user:${action}`;
    element.disabled = !hasPermission(permission);
  });

  // Asset Management Actions
  const assetActions = document.querySelectorAll("[data-resource='asset']");
  assetActions.forEach((element) => {
    const action = element.dataset.action;
    const permission = `asset:${action}`;
    element.disabled = !hasPermission(permission);
  });

  // Reporting Actions
  const reportActions = document.querySelectorAll("[data-resource='report']");
  reportActions.forEach((element) => {
    const action = element.dataset.action;
    const permission = `report:${action}`;
    element.disabled = !hasPermission(permission);
  });
};

/**
 * Safe action executor
 * Checks permission before executing action
 *
 * @param {string} permission - Permission to check
 * @param {Function} callback - Function to execute if permission granted
 * @param {Function} errorCallback - Function to execute if permission denied
 */
export const executeIfPermitted = (
  permission,
  callback,
  errorCallback = null
) => {
  if (hasPermission(permission)) {
    callback();
  } else {
    console.warn(`[Permission Denied] ${permission}`);
    if (errorCallback) {
      errorCallback();
    } else {
      showAccessDeniedMessage(permission);
    }
  }
};

/**
 * Show access denied notification
 * @param {string} permission
 */
export const showAccessDeniedMessage = (permission) => {
  const message = `You don't have permission to perform this action: ${permission}`;

  // If you have a notification system, use it
  if (window.showNotification) {
    window.showNotification(message, "error");
  } else {
    alert(message);
  }

  console.error(message);
};

/**
 * Build dynamic action menu based on permissions
 * @param {Array<string>} actions - List of possible actions
 * @param {string} resource - Resource type (user, asset, etc.)
 * @returns {Array<Object>} - Filtered actions user can perform
 */
export const buildPermittedActionMenu = (actions, resource = null) => {
  return actions.filter((action) => {
    const permission = resource ? `${resource}:${action}` : action;
    return hasPermission(permission);
  });
};

/**
 * Create dynamic navbar based on permissions
 * @returns {HTMLElement}
 */
export const createDynamicNavbar = () => {
  const navItems = [
    {
      label: "Users",
      href: "/users",
      permission: "user:read",
      icon: "👥",
    },
    {
      label: "Assets",
      href: "/assets",
      permission: "asset:read",
      icon: "📦",
    },
    {
      label: "Reports",
      href: "/reports",
      permission: "report:view",
      icon: "📊",
    },
    {
      label: "Admin Panel",
      href: "/admin",
      permission: "*", // Super admin only
      icon: "⚙️",
    },
  ];

  const navbar = document.createElement("nav");
  navbar.className = "navbar";

  navItems.forEach((item) => {
    if (hasPermission(item.permission)) {
      const link = document.createElement("a");
      link.href = item.href;
      link.textContent = `${item.icon} ${item.label}`;
      link.className = "nav-link";
      navbar.appendChild(link);
    }
  });

  return navbar;
};

/**
 * Create action buttons dynamically
 * @param {Array<Object>} actionConfig - Configuration for buttons
 * @returns {HTMLElement}
 *
 * Example actionConfig:
 * [
 *   { label: "Create", action: "create", resource: "user", class: "btn-primary" },
 *   { label: "Edit", action: "update", resource: "user", class: "btn-secondary" },
 *   { label: "Delete", action: "delete", resource: "user", class: "btn-danger" },
 * ]
 */
export const createActionButtons = (actionConfig) => {
  const container = document.createElement("div");
  container.className = "action-buttons";

  actionConfig.forEach((config) => {
    const { label, action, resource, class: btnClass, callback } = config;
    const permission = resource ? `${resource}:${action}` : action;

    if (hasPermission(permission)) {
      const button = document.createElement("button");
      button.className = `btn ${btnClass || "btn-default"}`;
      button.textContent = label;
      button.type = "button";

      if (callback) {
        button.addEventListener("click", callback);
      }

      container.appendChild(button);
    }
  });

  return container;
};

/**
 * Add event listeners to permission-controlled elements
 */
export const addPermissionEventListeners = () => {
  // Add buttons
  const addButtons = document.querySelectorAll("button[data-action='create']");
  addButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      executeIfPermitted(
        btn.dataset.requirePermission || "user:create",
        () => {
          console.log("Create action triggered");
          // Trigger actual create logic
        }
      );
    });
  });

  // Delete buttons
  const deleteButtons = document.querySelectorAll("button[data-action='delete']");
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (
        confirm(
          "Are you sure you want to delete this item?"
        )
      ) {
        executeIfPermitted(
          btn.dataset.requirePermission || "user:delete",
          () => {
            console.log("Delete action triggered");
            // Trigger actual delete logic
          }
        );
      }
    });
  });
};

/**
 * Enable reactive permission checking (optional - for advanced use)
 * Monitors permission changes and updates UI
 */
export const enableReactivePermissionChecks = () => {
  // Watch for permission changes in localStorage
  window.addEventListener("storage", (e) => {
    if (e.key === "authData") {
      // Permissions have changed, update UI
      initPermissionControls();
    }
  });
};

/**
 * Show permission matrix/table for debugging
 * Useful for admin panels
 */
export const showPermissionMatrix = () => {
  const permissions = [
    "user:create",
    "user:read",
    "user:update",
    "user:delete",
    "asset:create",
    "asset:read",
    "asset:update",
    "asset:delete",
    "report:view",
    "report:export",
  ];

  console.table(
    permissions.map((perm) => ({
      Permission: perm,
      Granted: hasPermission(perm) ? "✅" : "❌",
    }))
  );
};

export default {
  initPermissionControls,
  hideElementsWithoutPermissions,
  updateButtonStates,
  toggleAdminSections,
  executeIfPermitted,
  buildPermittedActionMenu,
  createDynamicNavbar,
  createActionButtons,
  addPermissionEventListeners,
  enableReactivePermissionChecks,
  showPermissionMatrix,
};
