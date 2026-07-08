import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { registerSchema, loginSchema } from "../validations/auth.validation";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (customer or provider)
 * @access  Public
 */
router.post("/register", validate(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login and receive a JWT token
 * @access  Public
 */
router.post("/login", validate(loginSchema), login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
router.get("/me", authenticate, getMe);

export default router;
