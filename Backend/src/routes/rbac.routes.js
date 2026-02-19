/**
 * RBAC Example Routes
 * Demonstrates how to use the permission-based authorization system
 * in real API endpoints
 *
 * These are example routes showing best practices for permission checking
 */

import express from "express";
import { verifyJWT, populatePermissions } from "../middlewares/auth.middleware.js";
import {
  checkPermission,
  checkAllPermissions,
  checkScopePermission,
} from "../middlewares/authorizationMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";

const router = express.Router();

// =====================================================
// USER MANAGEMENT ROUTES
// =====================================================

/**
 * GET /api/users
 * List all users
 * Requires: user:read permission
 */
router.get(
  "/users",
  verifyJWT,
  populatePermissions,
  checkPermission("user:read"),
  asyncHandler(async (req, res) => {
    // Placeholder: Fetch users from database
    // In real implementation, query based on user's scope (branch/enterprise)

    res.status(200).json(
      new apiResponse(
        [
          {
            id: "user123",
            name: "John Doe",
            email: "john@example.com",
            role: "Branch Admin",
          },
        ],
        "Users retrieved successfully",
        true,
        200
      )
    );
  })
);

/**
 * POST /api/users
 * Create a new user
 * Requires: user:create permission
 * Scope: Must have access to target branch/enterprise
 */
router.post(
  "/users",
  verifyJWT,
  populatePermissions,
  checkPermission("user:create"),
  asyncHandler(async (req, res) => {
    const { name, email, branchId, organizationId } = req.body;

    // Validate required fields
    if (!name || !email) {
      throw new apiError(400, "Name and email are required");
    }

    // In production: Check if user has scope access to target branch/enterprise
    // checkScopeAccess(req.user, branchId, organizationId)

    // Placeholder: Create user in database
    res.status(201).json(
      new apiResponse(
        { id: "newUser123", name, email },
        "User created successfully",
        true,
        201
      )
    );
  })
);

/**
 * PUT /api/users/:id
 * Update user information
 * Requires: user:update permission
 */
router.put(
  "/users/:id",
  verifyJWT,
  populatePermissions,
  checkPermission("user:update"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, designation } = req.body;

    // Placeholder: Update user in database
    res.status(200).json(
      new apiResponse(
        { id, name, email, designation },
        "User updated successfully",
        true
      )
    );
  })
);

/**
 * DELETE /api/users/:id
 * Delete a user
 * Requires: user:delete permission (critical operation)
 */
router.delete(
  "/users/:id",
  verifyJWT,
  populatePermissions,
  checkPermission("user:delete"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Placeholder: Delete user from database with audit logging
    res.status(200).json(
      new apiResponse(
        { id },
        "User deleted successfully",
        true
      )
    );
  })
);

/**
 * PATCH /api/users/:id/disable
 * Disable a user account
 * Requires: user:disable permission
 */
router.patch(
  "/users/:id/disable",
  verifyJWT,
  populatePermissions,
  checkPermission("user:disable"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Placeholder: Mark user as disabled
    res.status(200).json(
      new apiResponse(
        { id, isActive: false },
        "User disabled successfully",
        true
      )
    );
  })
);

// =====================================================
// ASSET MANAGEMENT ROUTES
// =====================================================

/**
 * GET /api/assets
 * List assets
 * Requires: asset:read permission
 */
router.get(
  "/assets",
  verifyJWT,
  populatePermissions,
  checkPermission("asset:read"),
  asyncHandler(async (req, res) => {
    // Placeholder: Fetch assets within user's scope
    res.status(200).json(
      new apiResponse(
        [
          {
            id: "asset123",
            name: "Laptop",
            serialNumber: "SN123456",
            status: "ACTIVE",
          },
        ],
        "Assets retrieved successfully",
        true
      )
    );
  })
);

/**
 * POST /api/assets
 * Create a new asset
 * Requires: asset:create permission
 */
router.post(
  "/assets",
  verifyJWT,
  populatePermissions,
  checkPermission("asset:create"),
  asyncHandler(async (req, res) => {
    const { name, serialNumber, branchId } = req.body;

    if (!name || !serialNumber) {
      throw new apiError(400, "Name and serial number are required");
    }

    // Placeholder: Create asset
    res.status(201).json(
      new apiResponse(
        { id: "newAsset123", name, serialNumber },
        "Asset created successfully",
        true,
        201
      )
    );
  })
);

/**
 * POST /api/assets/:id/assign
 * Assign asset to user
 * Requires: asset:assign permission
 */
router.post(
  "/assets/:id/assign",
  verifyJWT,
  populatePermissions,
  checkPermission("asset:assign"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      throw new apiError(400, "User ID is required");
    }

    // Placeholder: Assign asset to user
    res.status(200).json(
      new apiResponse(
        { assetId: id, assignedTo: userId },
        "Asset assigned successfully",
        true
      )
    );
  })
);

/**
 * POST /api/assets/:id/transfer
 * Transfer asset between users/branches
 * Requires: asset:transfer permission
 */
router.post(
  "/assets/:id/transfer",
  verifyJWT,
  populatePermissions,
  checkPermission("asset:transfer"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { fromUserId, toUserId } = req.body;

    if (!fromUserId || !toUserId) {
      throw new apiError(400, "From and To user IDs are required");
    }

    // Placeholder: Transfer asset
    res.status(200).json(
      new apiResponse(
        { assetId: id, transferredFrom: fromUserId, transferredTo: toUserId },
        "Asset transferred successfully",
        true
      )
    );
  })
);

/**
 * DELETE /api/assets/:id
 * Delete asset
 * Requires: asset:delete permission
 */
router.delete(
  "/assets/:id",
  verifyJWT,
  populatePermissions,
  checkPermission("asset:delete"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Placeholder: Delete asset
    res.status(200).json(
      new apiResponse(
        { id },
        "Asset deleted successfully",
        true
      )
    );
  })
);

// =====================================================
// REPORTING ROUTES
// =====================================================

/**
 * GET /api/reports
 * Get reports
 * Requires: report:view permission
 */
router.get(
  "/reports",
  verifyJWT,
  populatePermissions,
  checkPermission("report:view"),
  asyncHandler(async (req, res) => {
    // Placeholder: Get reports
    res.status(200).json(
      new apiResponse(
        [
          { id: "report1", name: "Asset Summary", type: "summary" },
        ],
        "Reports retrieved successfully",
        true
      )
    );
  })
);

/**
 * POST /api/reports/:id/export
 * Export report to CSV
 * Requires: report:export permission
 */
router.post(
  "/reports/:id/export",
  verifyJWT,
  populatePermissions,
  checkPermission("report:export"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Placeholder: Generate CSV
    res.status(200).json(
      new apiResponse(
        { reportId: id, format: "csv", downloadUrl: "/files/report.csv" },
        "Report exported successfully",
        true
      )
    );
  })
);

// =====================================================
// PERMISSIONS MANAGEMENT (Admin Only)
// =====================================================

/**
 * GET /api/admin/permissions
 * List all system permissions
 * Requires: system:admin permission
 */
router.get(
  "/admin/permissions",
  verifyJWT,
  populatePermissions,
  checkPermission("system:admin"),
  asyncHandler(async (req, res) => {
    // Placeholder: Get all permissions from database
    res.status(200).json(
      new apiResponse(
        [
          { key: "user:create", description: "Create users" },
          { key: "user:delete", description: "Delete users" },
        ],
        "Permissions retrieved successfully",
        true
      )
    );
  })
);

/**
 * GET /api/admin/roles
 * List all system roles
 * Requires: system:admin permission
 */
router.get(
  "/admin/roles",
  verifyJWT,
  populatePermissions,
  checkPermission("system:admin"),
  asyncHandler(async (req, res) => {
    // Placeholder: Get all roles from database
    res.status(200).json(
      new apiResponse(
        [
          {
            name: "super_admin",
            displayName: "Super Administrator",
            permissions: ["*"],
          },
          {
            name: "branch_admin",
            displayName: "Branch Administrator",
            permissions: ["user:create", "user:read", "user:update"],
          },
        ],
        "Roles retrieved successfully",
        true
      )
    );
  })
);

/**
 * POST /api/admin/users/import
 * Bulk import users
 * Requires: user:create AND user:import permissions
 */
router.post(
  "/admin/users/import",
  verifyJWT,
  populatePermissions,
  checkAllPermissions(["user:create", "user:import"]),
  asyncHandler(async (req, res) => {
    const { users } = req.body;

    if (!Array.isArray(users)) {
      throw new apiError(400, "Users array is required");
    }

    // Placeholder: Import users from CSV/Excel
    res.status(200).json(
      new apiResponse(
        { imported: users.length },
        `${users.length} users imported successfully`,
        true
      )
    );
  })
);

export default router;
