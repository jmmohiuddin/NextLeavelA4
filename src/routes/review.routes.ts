import { Router } from "express";
import { createReview } from "../controllers/review.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireCustomer } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { createReviewSchema } from "../validations/payment.review.validation";

const router = Router();

/**
 * @route   POST /api/reviews
 * @desc    Submit a review for a gear item (only allowed after RETURNED status)
 * @access  Private [CUSTOMER]
 */
router.post(
  "/",
  authenticate,
  requireCustomer,
  validate(createReviewSchema),
  createReview
);

export default router;
