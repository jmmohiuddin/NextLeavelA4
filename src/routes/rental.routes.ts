import { Router } from "express";
import {
  createRental,
  getMyRentals,
  getRentalById,
} from "../controllers/rental.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireCustomer } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { createRentalSchema } from "../validations/rental.validation";

const router = Router();

// All rental routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/rentals
 * @desc    Create a new rental order (customer only)
 * @access  Private [CUSTOMER]
 */
router.post("/", requireCustomer, validate(createRentalSchema), createRental);

/**
 * @route   GET /api/rentals
 * @desc    Get the authenticated customer's rental orders
 * @access  Private [CUSTOMER]
 * @query   status, page, limit
 */
router.get("/", requireCustomer, getMyRentals);

/**
 * @route   GET /api/rentals/:id
 * @desc    Get a specific rental order by ID
 * @access  Private [CUSTOMER, PROVIDER, ADMIN]
 */
router.get("/:id", getRentalById);

export default router;
