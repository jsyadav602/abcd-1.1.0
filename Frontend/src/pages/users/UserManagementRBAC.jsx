/**
 * RBAC Example Component
 * Demonstrates permission-based UI rendering for a user management page
 */

import {
  hasPermission,
  hasAnyPermission,
  isSuperAdmin,
  getCurrentUser,
} from "../utils/permissionHelper.js";
import {
  initPermissionControls,
  executeIfPermitted,
  buildPermittedActionMenu,
  createActionButtons,
} from "../utils/permissionUIController.js";

/**
 * Create User Management Page with Permission-Based UI
 * 
 * Architecture:
 * - All UI elements are conditionally rendered based on permissions
 * - Buttons are disabled if user lacks permission
 * - Sections are hidden if user lacks permission
 * - All actions are protected both frontend (UI) and backend (API)
 */

export const createUserManagementPage = () => {
  const container = document.createElement("div");
  container.className = "user-management-page";
  container.id = "userManagementPage";

  // ===== PAGE HEADER =====
  const header = createPageHeader();
  container.appendChild(header);

  // ===== ACTION TOOLBAR =====
  const toolbar = createActionToolbar();
  container.appendChild(toolbar);

  // ===== USERS TABLE =====
  const table = createUsersTable();
  container.appendChild(table);

  // ===== MODAL WINDOWS (hidden by default) =====
  const createModal = createUserModal("create");
  container.appendChild(createModal);

  const editModal = createUserModal("edit");
  container.appendChild(editModal);

  // Initialize permission controls after DOM is ready
  setTimeout(() => {
    initPermissionControls();
    attachEventListeners();
  }, 0);

  return container;
};

/**
 * Create page header with user info
 */
const createPageHeader = () => {
  const header = document.createElement("section");
  header.className = "page-header";

  const user = getCurrentUser();

  const title = document.createElement("h1");
  title.textContent = "User Management";

  const userInfo = document.createElement("div");
  userInfo.className = "user-info";
  userInfo.innerHTML = `
    <span>👤 ${user?.name || "User"}</span>
    <span>${
      isSuperAdmin()
        ? "🔐 Super Admin"
        : "👤 Regular Admin"
    }</span>
  `;

  header.appendChild(title);
  header.appendChild(userInfo);

  return header;
};

/**
 * Create action toolbar with buttons
 */
const createActionToolbar = () => {
  const toolbar = document.createElement("section");
  toolbar.className = "action-toolbar";
  toolbar.id = "actionToolbar";

  // ===== ADD USER BUTTON =====
  // Only show if user has "user:create" permission
  const addButton = document.createElement("button");
  addButton.id = "addUserBtn";
  addButton.className = "btn btn-primary";
  addButton.textContent = "➕ Add New User";
  addButton.setAttribute("data-permission", "user:create");
  addButton.setAttribute("data-action", "create");
  addButton.setAttribute("data-require-permission", "user:create");

  // ===== IMPORT USERS BUTTON =====
  // Only show if user has both "user:create" AND "user:import" permissions
  const importButton = document.createElement("button");
  importButton.id = "importUsersBtn";
  importButton.className = "btn btn-secondary";
  importButton.textContent = "📥 Import Users";
  importButton.setAttribute("data-permission", "user:create&user:import");
  importButton.setAttribute("data-action", "import");

  // ===== EXPORT BUTTON =====
  // Show if user has "audit:export" permission
  const exportButton = document.createElement("button");
  exportButton.id = "exportUsersBtn";
  exportButton.className = "btn btn-secondary";
  exportButton.textContent = "📥 Export";
  exportButton.setAttribute("data-permission", "audit:export|report:export");
  exportButton.setAttribute("data-action", "export");

  // ===== ADMIN TOOLS BUTTON =====
  // Only for Super Admin (has "*" permission or explicit admin permission)
  const adminBtn = document.createElement("button");
  adminBtn.id = "adminToolsBtn";
  adminBtn.className = "btn btn-danger";
  adminBtn.textContent = "⚙️ Admin Tools";
  adminBtn.setAttribute("data-permission", "*");
  adminBtn.setAttribute("data-action", "admin");
  adminBtn.setAttribute("data-admin-only", "true");

  toolbar.appendChild(addButton);
  toolbar.appendChild(importButton);
  toolbar.appendChild(exportButton);
  toolbar.appendChild(adminBtn);

  return toolbar;
};

/**
 * Create users table with action column
 */
const createUsersTable = () => {
  const section = document.createElement("section");
  section.className = "users-table-section";
  section.setAttribute("data-permission", "user:read");

  const table = document.createElement("table");
  table.className = "table table-striped";
  table.id = "usersTable";
  table.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
        <th>Branch</th>
        <th>Status</th>
        <th class="permissions-column" data-permission="user:update|user:delete">Actions</th>
      </tr>
    </thead>
    <tbody>
      <!-- Users will be populated here -->
      <tr class="user-row" data-user-id="user-001">
        <td>USR001</td>
        <td>John Doe</td>
        <td>john@company.com</td>
        <td>Branch Admin</td>
        <td>Main Branch</td>
        <td><span class="badge badge-success">Active</span></td>
        <td class="action-column">
          <!-- Edit button - requires user:update permission -->
          <button class="btn-icon btn-edit" 
            data-permission="user:update"
            data-action="update"
            data-resource="user"
            data-require-permission="user:update"
            title="Edit User">
            ✏️
          </button>
          
          <!-- Password button - requires user:change_password permission -->
          <button class="btn-icon btn-password" 
            data-permission="user:change_password"
            data-action="change_password"
            data-resource="user"
            data-require-permission="user:change_password"
            title="Change Password">
            🔑
          </button>
          
          <!-- Disable button - requires user:disable permission -->
          <button class="btn-icon btn-disable" 
            data-permission="user:disable"
            data-action="disable"
            data-resource="user"
            data-require-permission="user:disable"
            title="Disable User">
            ⛔
          </button>
          
          <!-- Delete button - requires user:delete permission (critical) -->
          <button class="btn-icon btn-delete btn-danger" 
            data-permission="user:delete"
            data-action="delete"
            data-resource="user"
            data-require-permission="user:delete"
            title="Delete User">
            🗑️
          </button>
        </td>
      </tr>
      <tr class="user-row" data-user-id="user-002">
        <td>USR002</td>
        <td>Jane Smith</td>
        <td>jane@company.com</td>
        <td>User</td>
        <td>Branch 2</td>
        <td><span class="badge badge-success">Active</span></td>
        <td class="action-column">
          <button class="btn-icon btn-edit" data-permission="user:update">✏️</button>
          <button class="btn-icon btn-password" data-permission="user:change_password">🔑</button>
          <button class="btn-icon btn-disable" data-permission="user:disable">⛔</button>
          <button class="btn-icon btn-delete btn-danger" data-permission="user:delete">🗑️</button>
        </td>
      </tr>
    </tbody>
  `;

  section.appendChild(table);

  return section;
};

/**
 * Create user form modal
 */
const createUserModal = (type) => {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = `${type}UserModal`;
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${type === "create" ? "Add New User" : "Edit User"}</h2>
        <button class="modal-close">✕</button>
      </div>
      <form class="user-form" id="${type}UserForm">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" name="name" required />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" required />
        </div>
        <div class="form-group">
          <label>Role</label>
          <select name="roleId" required>
            <option>Select Role</option>
            <option value="role-1" data-permission="user:assign_role">Branch Admin</option>
            <option value="role-2" data-permission="user:assign_role">User</option>
          </select>
        </div>
        <div class="form-group" data-permission="user:assign_branch">
          <label>Assign Branches</label>
          <div class="branch-checkboxes">
            <label><input type="checkbox" name="branches" value="branch-1"> Main Branch</label>
            <label><input type="checkbox" name="branches" value="branch-2"> Branch 2</label>
            <label><input type="checkbox" name="branches" value="branch-3"> Branch 3</label>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            ${type === "create" ? "Create" : "Update"} User
          </button>
          <button type="button" class="btn btn-secondary modal-close-btn">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `;

  return modal;
};

/**
 * Attach event listeners to interactive elements
 */
const attachEventListeners = () => {
  // Add User Button
  const addBtn = document.getElementById("addUserBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      executeIfPermitted("user:create", () => {
        const modal = document.getElementById("createUserModal");
        modal.style.display = "flex";
      });
    });
  }

  // Edit User Buttons
  const editBtns = document.querySelectorAll(".btn-edit");
  editBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      executeIfPermitted("user:update", () => {
        const userId = e.target.closest(".user-row").getAttribute("data-user-id");
        console.log("Edit user:", userId);
        // Show edit modal with user data
      });
    });
  });

  // Delete User Buttons
  const deleteBtns = document.querySelectorAll(".btn-delete");
  deleteBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (confirm("Are you sure you want to delete this user?")) {
        executeIfPermitted("user:delete", () => {
          const userId = e.target.closest(".user-row").getAttribute("data-user-id");
          console.log("Delete user:", userId);
          // Call API to delete user
        });
      }
    });
  });

  // Disable User Buttons
  const disableBtns = document.querySelectorAll(".btn-disable");
  disableBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      executeIfPermitted("user:disable", () => {
        const userId = e.target.closest(".user-row").getAttribute("data-user-id");
        console.log("Disable user:", userId);
        // Call API to disable user
      });
    });
  });

  // Form Submission
  const forms = document.querySelectorAll(".user-form");
  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      executeIfPermitted("user:create", () => {
        console.log("Form submitted:", new FormData(form));
        // Call API to create/update user
      });
    });
  });

  // Modal Close Buttons
  const closeButtons = document.querySelectorAll(".modal-close, .modal-close-btn");
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal");
      if (modal) {
        modal.style.display = "none";
      }
    });
  });
};

export default createUserManagementPage;
