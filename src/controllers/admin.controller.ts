import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { sendSuccess, sendError } from "../utils/response";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const qs = (v: any): string => (Array.isArray(v) ? v[0] : v) || "";


// ─── GET /api/admin/users ────────────────────────────────────────────────────
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role, status, search, page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(1, parseInt(qs(page as string | string[]) || "1") || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(qs(limit as string | string[]) || "10") || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (role) where.role = qs(role as string | string[]);
    if (status) where.status = qs(status as string | string[]);
    if (search) {
      const s = qs(search as string | string[]);
      where.OR = [
        { name: { contains: s, mode: "insensitive" } },
        { email: { contains: s, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          phone: true,
          address: true,
          createdAt: true,
          _count: {
            select: {
              gearItems: true,
              rentalOrders: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    sendSuccess(res, 200, "Users retrieved successfully.", users, {
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/admin/users/:id ──────────────────────────────────────────────
export const updateUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status || !["ACTIVE", "SUSPENDED"].includes(status as string)) {
      sendError(res, 400, "Invalid status. Must be ACTIVE or SUSPENDED.", {
        provided: status,
        allowed: ["ACTIVE", "SUSPENDED"],
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      sendError(res, 404, "User not found.", { userId: id });
      return;
    }

    if (user.role === "ADMIN") {
      sendError(res, 403, "Admin accounts cannot be suspended.");
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    sendSuccess(
      res,
      200,
      `User ${status === "SUSPENDED" ? "suspended" : "activated"} successfully.`,
      updated
    );
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/gear ─────────────────────────────────────────────────────
export const getAllGearAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, search, page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(1, parseInt(qs(page as string | string[]) || "1") || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(qs(limit as string | string[]) || "10") || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (category) {
      where.category = {
        name: { contains: qs(category as string | string[]), mode: "insensitive" },
      };
    }
    if (search) {
      const s = qs(search as string | string[]);
      where.OR = [
        { name: { contains: s, mode: "insensitive" } },
        { brand: { contains: s, mode: "insensitive" } },
      ];
    }

    const [gear, total] = await Promise.all([
      prisma.gearItem.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true } },
          provider: { select: { id: true, name: true, email: true } },
          _count: { select: { rentalOrderItems: true, reviews: true } },
        },
      }),
      prisma.gearItem.count({ where }),
    ]);

    sendSuccess(res, 200, "All gear listings retrieved successfully.", gear, {
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/admin/rentals ──────────────────────────────────────────────────
export const getAllRentalsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(1, parseInt(qs(page as string | string[]) || "1") || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(qs(limit as string | string[]) || "10") || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (status) where.status = qs(status as string | string[]);

    const [rentals, total] = await Promise.all([
      prisma.rentalOrder.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              gearItem: { select: { id: true, name: true, brand: true } },
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

    sendSuccess(
      res,
      200,
      "All rental orders retrieved successfully.",
      rentals,
      { total, page: pageNum, limit: limitNum }
    );
  } catch (error) {
    next(error);
  }
};
