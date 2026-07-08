import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { sendSuccess, sendError } from "../utils/response";

// Helper to safely extract string from query param
const qs = (v: unknown): string | undefined =>
  Array.isArray(v) ? (v[0] as string) : (v as string | undefined);

// ─── GET /api/gear ───────────────────────────────────────────────────────────
export const getAllGear = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = req.query;
    const pageNum = Math.max(1, parseInt(qs(q.page) || "1") || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(qs(q.limit) || "10") || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (qs(q.available) !== "false") {
      where.isAvailable = true;
    }
    if (q.category) {
      where.category = { name: { contains: qs(q.category), mode: "insensitive" } };
    }
    if (q.brand) {
      where.brand = { contains: qs(q.brand), mode: "insensitive" };
    }
    const minP = qs(q.minPrice);
    const maxP = qs(q.maxPrice);
    if (minP || maxP) {
      where.pricePerDay = {
        ...(minP ? { gte: parseFloat(minP) } : {}),
        ...(maxP ? { lte: parseFloat(maxP) } : {}),
      };
    }
    if (q.search) {
      const s = qs(q.search);
      where.OR = [
        { name: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
        { brand: { contains: s, mode: "insensitive" } },
      ];
    }

    const validSortFields = ["pricePerDay", "createdAt", "name", "brand"];
    const sortField = validSortFields.includes(qs(q.sortBy) || "") ? qs(q.sortBy)! : "createdAt";
    const orderDir = qs(q.order) === "asc" ? "asc" as const : "desc" as const;

    const [rawGear, total] = await Promise.all([
      prisma.gearItem.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: orderDir },
        include: {
          category: { select: { id: true, name: true } },
          provider: { select: { id: true, name: true } },
          reviews: { select: { rating: true } },
        },
      }),
      prisma.gearItem.count({ where }),
    ]);

    // Compute average rating
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gearWithRatings = (rawGear as any[]).map((g: any) => {
      const reviews: { rating: number }[] = g.reviews || [];
      const averageRating =
        reviews.length > 0
          ? +(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : null;
      const { reviews: _r, ...rest } = g;
      void _r;
      return { ...rest, averageRating, reviewCount: reviews.length };
    });

    sendSuccess(res, 200, "Gear items retrieved successfully.", gearWithRatings, {
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/gear/:id ───────────────────────────────────────────────────────
export const getGearById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const gear = await prisma.gearItem.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, description: true } },
        provider: { select: { id: true, name: true, phone: true, address: true } },
        reviews: {
          include: { customer: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!gear) {
      sendError(res, 404, "Gear item not found.", { gearId: id });
      return;
    }

    const reviews: { rating: number }[] = (gear as any).reviews || [];
    const averageRating =
      reviews.length > 0
        ? +(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    sendSuccess(res, 200, "Gear item retrieved successfully.", {
      ...gear,
      averageRating,
      reviewCount: reviews.length,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/categories ─────────────────────────────────────────────────────
export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { gearItems: true } } },
    });

    sendSuccess(res, 200, "Categories retrieved successfully.", categories);
  } catch (error) {
    next(error);
  }
};
