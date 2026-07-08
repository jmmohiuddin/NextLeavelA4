import { Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const qs = (v: any): string => (Array.isArray(v) ? v[0] : v) || "";


// ─── POST /api/rentals ───────────────────────────────────────────────────────
export const createRental = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, notes, items } = req.body;
    const customerId = req.user!.userId;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (days < 1) {
      sendError(res, 400, "Rental period must be at least 1 day.", {
        field: "endDate",
      });
      return;
    }

    // Validate all gear items exist, are available, and have sufficient stock
    const gearIds = items.map((i: { gearItemId: string }) => i.gearItemId);
    const gearItems = await prisma.gearItem.findMany({
      where: { id: { in: gearIds } },
    });

    if (gearItems.length !== gearIds.length) {
      const foundIds = gearItems.map((g) => g.id);
      const missingIds = gearIds.filter((id: string) => !foundIds.includes(id));
      sendError(res, 404, "One or more gear items not found.", { missingIds });
      return;
    }

    let totalAmount = 0;
    const orderItems: {
      gearItemId: string;
      quantity: number;
      pricePerDay: number;
    }[] = [];

    for (const item of items as { gearItemId: string; quantity: number }[]) {
      const gear = gearItems.find((g) => g.id === item.gearItemId)!;
      if (!gear.isAvailable) {
        sendError(res, 400, `Gear item "${gear.name}" is not available.`, {
          gearItemId: gear.id,
        });
        return;
      }
      if (gear.stock < item.quantity) {
        sendError(
          res,
          400,
          `Insufficient stock for "${gear.name}". Available: ${gear.stock}, Requested: ${item.quantity}.`,
          { gearItemId: gear.id }
        );
        return;
      }
      const pricePerDay = Number(gear.pricePerDay);
      totalAmount += pricePerDay * item.quantity * days;
      orderItems.push({
        gearItemId: gear.id,
        quantity: item.quantity,
        pricePerDay,
      });
    }

    // Create rental order with items in a transaction
    const rentalOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.rentalOrder.create({
        data: {
          customerId,
          startDate: start,
          endDate: end,
          totalAmount,
          notes,
          status: "PLACED",
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              gearItem: {
                select: { id: true, name: true, brand: true, images: true },
              },
            },
          },
          customer: { select: { id: true, name: true, email: true } },
        },
      });

      return order;
    });

    sendSuccess(
      res,
      201,
      "Rental order placed successfully. Proceed to payment.",
      rentalOrder
    );
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/rentals ────────────────────────────────────────────────────────
export const getMyRentals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = req.user!.userId;
    const { status, page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(1, parseInt(qs(page as string | string[]) || "1") || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(qs(limit as string | string[]) || "10") || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { customerId };
    if (status) where.status = qs(status as string | string[]);

    const [rentals, total] = await Promise.all([
      prisma.rentalOrder.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              gearItem: {
                select: { id: true, name: true, brand: true, images: true },
              },
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              provider: true,
              paidAt: true,
            },
          },
        },
      }),
      prisma.rentalOrder.count({ where }),
    ]);

    sendSuccess(res, 200, "Rental orders retrieved successfully.", rentals, {
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/rentals/:id ────────────────────────────────────────────────────
export const getRentalById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const rental = await prisma.rentalOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            gearItem: {
              include: {
                category: { select: { id: true, name: true } },
                provider: { select: { id: true, name: true } },
              },
            },
          },
        },
        customer: { select: { id: true, name: true, email: true, phone: true } },
        payment: true,
        reviews: {
          include: {
            customer: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!rental) {
      sendError(res, 404, "Rental order not found.", { rentalId: id });
      return;
    }

    if (userRole === "CUSTOMER" && rental.customerId !== userId) {
      sendError(res, 403, "You do not have permission to view this rental.");
      return;
    }

    if (userRole === "PROVIDER") {
      const rentalAny = rental as any;
      const providerGearIds = rentalAny.items.map(
        (i: any) => i.gearItem.provider.id
      );
      if (!providerGearIds.includes(userId)) {
        sendError(res, 403, "You do not have permission to view this rental.");
        return;
      }
    }

    sendSuccess(res, 200, "Rental order retrieved successfully.", rental);
  } catch (error) {
    next(error);
  }
};
