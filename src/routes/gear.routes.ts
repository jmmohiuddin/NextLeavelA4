import { Router } from "express";
import {
  getAllGear,
  getGearById,
  getAllCategories,
} from "../controllers/gear.controller";

const router = Router();

/**
 * @route   GET /api/gear
 * @desc    Get all available gear with filters (category, brand, price, availability, search)
 * @access  Public
 * @query   category, brand, minPrice, maxPrice, available, search, page, limit, sortBy, order
 */
router.get("/", getAllGear);

/**
 * @route   GET /api/gear/:id
 * @desc    Get a single gear item by ID with reviews and provider info
 * @access  Public
 */
router.get("/:id", getGearById);

/**
 * @route   GET /api/categories
 * @desc    Get all gear categories
 * @access  Public
 */
// Note: categories are also mounted directly at /api/categories in app.ts
export const categoryRouter = Router();
categoryRouter.get("/", getAllCategories);

export default router;
