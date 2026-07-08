import { Router, Request, Response } from "express";
import {
  createPayment,
  confirmPayment,
  getMyPayments,
  getPaymentById,
} from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireCustomer } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import { createPaymentSchema } from "../validations/payment.review.validation";
import { sendSuccess } from "../utils/response";

const router = Router();

/**
 * @route   POST /api/payments/create
 * @desc    Create a payment session for a confirmed rental order (SSLCommerz)
 * @access  Private [CUSTOMER]
 */
router.post(
  "/create",
  authenticate,
  requireCustomer,
  validate(createPaymentSchema),
  createPayment
);

/**
 * @route   POST /api/payments/confirm/success
 * @desc    SSLCommerz success callback / IPN — confirms payment and updates order status to PAID
 * @access  Public (called by SSLCommerz gateway)
 */
router.post("/confirm/success", confirmPayment);

/**
 * @route   POST /api/payments/confirm/ipn
 * @desc    SSLCommerz IPN (Instant Payment Notification)
 * @access  Public (called by SSLCommerz)
 */
router.post("/confirm/ipn", confirmPayment);

/**
 * @route   POST /api/payments/confirm/fail
 * @desc    SSLCommerz fail callback
 * @access  Public
 */
router.post("/confirm/fail", (req: Request, res: Response) => {
  sendSuccess(res, 200, "Payment was not completed. Please try again.", {
    status: "FAILED",
  });
});

/**
 * @route   POST /api/payments/confirm/cancel
 * @desc    SSLCommerz cancel callback
 * @access  Public
 */
router.post("/confirm/cancel", (req: Request, res: Response) => {
  sendSuccess(res, 200, "Payment was cancelled by the user.", {
    status: "CANCELLED",
  });
});

/**
 * @route   GET /api/payments
 * @desc    Get authenticated customer's payment history
 * @access  Private [CUSTOMER]
 * @query   page, limit
 */
router.get("/", authenticate, requireCustomer, getMyPayments);

/**
 * @route   GET /api/payments/:id
 * @desc    Get a specific payment by ID
 * @access  Private [CUSTOMER, ADMIN]
 */
router.get("/:id", authenticate, getPaymentById);

export default router;
