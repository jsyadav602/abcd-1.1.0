import mongoose from "mongoose";

/**
 * Permission Schema - Atomic permission definitions
 * Represents fine-grained permissions that can be assigned to roles
 *
 * Example permissions:
 * - "user:create" - Create new users
 * - "user:update" - Update user profiles
 * - "user:delete" - Delete users
 * - "user:change_password" - Change user passwords
 * - "asset:add" - Add assets
 * - "asset:update" - Update assets
 * - "asset:delete" - Delete assets
 * - "report:view" - View reports
 * - "*" - Super admin wildcard (all permissions)
 */

const permissionSchema = new mongoose.Schema(
  {
    // Unique permission key (e.g., "user:create")
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 100,
      pattern: /^[a-z0-9:_*]+$/,
      index: true,
      example: "user:create, user:update, asset:delete, report:view",
    },

    // Human-readable description
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
      example: "Permission to create new user accounts",
    },

    // Category/Module (for grouping related permissions)
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: [
        "user_management",
        "asset_management",
        "reporting",
        "organization",
        "branch",
        "system_admin",
        "audit",
      ],
      example: "user_management",
    },

    // Is this permission system-critical?
    isSystemPermission: {
      type: Boolean,
      default: false,
      note: "Permissions like 'user:change_password' that are critical",
    },

    // Active/Inactive status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Metadata
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
permissionSchema.index({ key: 1 });
permissionSchema.index({ category: 1 });
permissionSchema.index({ isActive: 1 });

// Middleware to update updatedAt on document modification
permissionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Permission = mongoose.model("Permission", permissionSchema);
