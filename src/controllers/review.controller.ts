import { Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";

// ─── POST /api/reviews ───────────────────────────────────────────────────────
export const createReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = req.user!.userId;
    const { gearItemId, rentalOrderId, rating, comment } = req.body;

    // Verify rental order exists and belongs to this customer
    const rentalOrder = await prisma.rentalOrder.findUnique({
      where: { id: rentalOrderId },
      include: {
        items: { select: { gearItemId: true } },
      },
    });

    if (!rentalOrder) {
      sendError(res, 404, "Rental order not found.", { rentalOrderId });
      return;
    }

    if (rentalOrder.customerId !== customerId) {
      sendError(res, 403, "You can only review your own rental orders.");
      return;
    }

    // ⚠️ CRITICAL: Reviews only allowed after gear is RETURNED
    if (rentalOrder.status !== "RETURNED") {
      sendError(
        res,
        400,
        "You can only leave a review after returning the gear. Current order status: " +
          rentalOrder.status,
        {
          currentStatus: rentalOrder.status,
          requiredStatus: "RETURNED",
        }
      );
      return;
    }

    // Verify the gear item was part of this rental
    const itemInOrder = rentalOrder.items.some(
      (item) => item.gearItemId === gearItemId
    );
    if (!itemInOrder) {
      sendError(
        res,
        400,
        "This gear item was not part of the specified rental order.",
        { gearItemId, rentalOrderId }
      );
      return;
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        customerId_gearItemId_rentalOrderId: {
          customerId,
          gearItemId,
          rentalOrderId,
        },
      },
    });

    if (existingReview) {
      sendError(res, 409, "You have already reviewed this gear item for this order.", {
        reviewId: existingReview.id,
      });
      return;
    }

    const review = await prisma.review.create({
      data: {
        customerId,
        gearItemId,
        rentalOrderId,
        rating,
        comment,
      },
      include: {
        customer: { select: { id: true, name: true } },
        gearItem: { select: { id: true, name: true, brand: true } },
      },
    });

    sendSuccess(res, 201, "Review submitted successfully.", review);
  } catch (error) {
    next(error);
  }
};
