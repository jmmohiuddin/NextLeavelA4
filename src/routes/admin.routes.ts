import { Router } from "express";
import {
  getAllUsers,
  updateUserStatus,
  getAllGearAdmin,
  getAllRentalsAdmin,
} from "../controllers/admin.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (customers + providers) with counts
 * @access  Private [ADMIN]
 * @query   role, status, search, page, limit
 */
router.get("/users", getAllUsers);

/**
 * @route   PATCH /api/admin/users/:id
 * @desc    Update user status (ACTIVE or SUSPENDED)
 * @access  Private [ADMIN]
 */
router.patch("/users/:id", updateUserStatus);

/**
 * @route   GET /api/admin/gear
 * @desc    Get all gear listings across all providers
 * @access  Private [ADMIN]
 * @query   category, search, page, limit
 */
router.get("/gear", getAllGearAdmin);

/**
 * @route   GET /api/admin/rentals
 * @desc    Get all rental orders across all customers
 * @access  Private [ADMIN]
 * @query   status, page, limit
 */
router.get("/rentals", getAllRentalsAdmin);

export default router;
