import { Router } from "express";
import {
  addGear,
  updateGear,
  deleteGear,
  getProviderOrders,
  updateOrderStatus,
} from "../controllers/provider.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireProvider } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createGearSchema,
  updateGearSchema,
} from "../validations/gear.validation";

const router = Router();

// All provider routes require authentication + PROVIDER role
router.use(authenticate, requireProvider);

/**
 * @route   POST /api/provider/gear
 * @desc    Add a new gear item to inventory
 * @access  Private [PROVIDER]
 */
router.post("/gear", validate(createGearSchema), addGear);

/**
 * @route   PUT /api/provider/gear/:id
 * @desc    Update a gear listing (only owner can update)
 * @access  Private [PROVIDER]
 */
router.put("/gear/:id", validate(updateGearSchema), updateGear);

/**
 * @route   DELETE /api/provider/gear/:id
 * @desc    Remove a gear item from inventory
 * @access  Private [PROVIDER]
 */
router.delete("/gear/:id", deleteGear);

/**
 * @route   GET /api/provider/orders
 * @desc    Get all rental orders containing this provider's gear
 * @access  Private [PROVIDER]
 * @query   status, page, limit
 */
router.get("/orders", getProviderOrders);

/**
 * @route   PATCH /api/provider/orders/:id
 * @desc    Update rental order status (CONFIRMED, CANCELLED, PICKED_UP, RETURNED)
 * @access  Private [PROVIDER]
 */
router.patch("/orders/:id", updateOrderStatus);

export default router;
