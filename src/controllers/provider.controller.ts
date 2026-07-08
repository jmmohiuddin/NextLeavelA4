import { Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const qs = (v: any): string => (Array.isArray(v) ? v[0] : v) || "";

// ─── POST /api/provider/gear ─────────────────────────────────────────────────
export const addGear = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const providerId = req.user!.userId;
    const {
      name,
      description,
      brand,
      pricePerDay,
      stock,
      isAvailable,
      images,
      specs,
      categoryId,
    } = req.body;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      sendError(res, 404, "Category not found.", { categoryId });
      return;
    }

    const gear = await prisma.gearItem.create({
      data: {
        name,
        description,
        brand,
        pricePerDay,
        stock: stock ?? 1,
        isAvailable: isAvailable ?? true,
        images: images || [],
        specs,
        categoryId,
        providerId,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    sendSuccess(res, 201, "Gear item added to inventory successfully.", gear);
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/provider/gear/:id ──────────────────────────────────────────────
export const updateGear = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const providerId = req.user!.userId;

    const gear = await prisma.gearItem.findUnique({ where: { id } });
    if (!gear) {
      sendError(res, 404, "Gear item not found.", { gearId: id });
      return;
    }

    if (gear.providerId !== providerId) {
      sendError(res, 403, "You can only update your own gear listings.");
      return;
    }

    const categoryId = qs(req.body.categoryId);
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        sendError(res, 404, "Category not found.", { categoryId });
        return;
      }
    }

    // Only allow updatable fields
    const {
      name,
      description,
      brand,
      pricePerDay,
      stock,
      isAvailable,
      images,
      specs,
    } = req.body;

    const updated = await prisma.gearItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(brand !== undefined && { brand }),
        ...(pricePerDay !== undefined && { pricePerDay }),
        ...(stock !== undefined && { stock }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(images !== undefined && { images }),
        ...(specs !== undefined && { specs }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    sendSuccess(res, 200, "Gear item updated successfully.", updated);
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/provider/gear/:id ───────────────────────────────────────────
export const deleteGear = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const providerId = req.user!.userId;

    const gear = await prisma.gearItem.findUnique({ where: { id } });
    if (!gear) {
      sendError(res, 404, "Gear item not found.", { gearId: id });
      return;
    }

    if (gear.providerId !== providerId) {
      sendError(res, 403, "You can only delete your own gear listings.");
      return;
    }

    await prisma.gearItem.delete({ where: { id } });

    sendSuccess(res, 200, "Gear item removed from inventory successfully.");
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/provider/orders ────────────────────────────────────────────────
export const getProviderOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const providerId = req.user!.userId;
    const { status, page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(1, parseInt(qs(page as string | string[]) || "1") || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(qs(limit as string | string[]) || "10") || 10));
    const skip = (pageNum - 1) * limitNum;

    const whereClause: Record<string, unknown> = {
      items: { some: { gearItem: { providerId } } },
    };
    if (status) whereClause.status = qs(status as string | string[]);

    const [orders, total] = await Promise.all([
      prisma.rentalOrder.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            where: { gearItem: { providerId } },
            include: {
              gearItem: {
                select: {
                  id: true,
                  name: true,
                  brand: true,
                  pricePerDay: true,
                },
              },
            },
          },
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          payment: {
            select: { id: true, status: true, amount: true, paidAt: true },
          },
        },
      }),
      prisma.rentalOrder.count({ where: whereClause }),
    ]);

    sendSuccess(res, 200, "Provider orders retrieved successfully.", orders, {
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/provider/orders/:id ─────────────────────────────────────────
export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const providerId = req.user!.userId;

    const validStatuses = ["CONFIRMED", "CANCELLED", "PICKED_UP", "RETURNED"];
    if (!status || !validStatuses.includes(status)) {
      sendError(
        res,
        400,
        `Invalid status. Provider can set: ${validStatuses.join(", ")}.`,
        { provided: status, allowed: validStatuses }
      );
      return;
    }

    const order = await prisma.rentalOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            gearItem: {
              select: { id: true, providerId: true },
            },
          },
        },
      },
    });

    if (!order) {
      sendError(res, 404, "Rental order not found.", { orderId: id });
      return;
    }

    const orderAny = order as any;
    const isProviderOrder = orderAny.items.some(
      (item: any) => item.gearItem.providerId === providerId
    );
    if (!isProviderOrder) {
      sendError(res, 403, "You do not have permission to update this order.");
      return;
    }

    // State machine validation
    const allowedTransitions: Record<string, string[]> = {
      PLACED: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["CANCELLED"],
      PAID: ["PICKED_UP"],
      PICKED_UP: ["RETURNED"],
    };

    const allowed = allowedTransitions[order.status] || [];
    if (!allowed.includes(status as string)) {
      sendError(
        res,
        400,
        `Cannot transition order from ${order.status} to ${status}.`,
        {
          currentStatus: order.status,
          requestedStatus: status,
          allowedTransitions: allowed,
        }
      );
      return;
    }

    const updatedOrder = await prisma.rentalOrder.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            gearItem: { select: { id: true, name: true } },
          },
        },
        customer: { select: { id: true, name: true, email: true } },
        payment: { select: { id: true, status: true } },
      },
    });

    sendSuccess(
      res,
      200,
      `Order status updated to ${status} successfully.`,
      updatedOrder
    );
  } catch (error) {
    next(error);
  }
};
